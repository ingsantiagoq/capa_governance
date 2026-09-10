import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const phases = new Set(['start', 'complete']);
const sha256Pattern = /^[a-f0-9]{64}$/;
const mandatedSequence = [
  'objective-clear',
  'plan-complete',
  'goal-active',
  'graphify-before',
  'agents-dispatched',
  'implementation',
  'agents-complete',
  'graphify-after',
  'peer-review-passed',
  'goal-complete'
];
const mandatedSkills = { plan: '/ultraplan', goal: '/goal', agents: '/agent', review: '/ultrareviewer' };

function uniqueStrings(value, minimum = 1) {
  return Array.isArray(value) && value.length >= minimum && value.every(item => typeof item === 'string' && item.trim()) && new Set(value).size === value.length;
}

function instant(value) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function validReceipt(value, skill) {
  return Boolean(value && value.skill === skill && value.invoked === true && typeof value.receipt === 'string' && value.receipt.trim());
}

export function evaluateClaudeExecution(input, policy) {
  const reasons = [];
  if (!policy || policy.kind !== 'claude-execution-policy' || policy.version !== 1 || policy.runtime !== 'claude-code' ||
      JSON.stringify(policy.requiredSequence) !== JSON.stringify(mandatedSequence) ||
      JSON.stringify(policy.skills) !== JSON.stringify(mandatedSkills) ||
      policy.planFallback !== 'objective-clarification-fallback' ||
      policy.attestationPath !== '.capa/claude-execution-attestation.json') {
    return { decision: 'BLOCK', phase: input?.phase ?? null, reasons: ['invalid-claude-execution-policy'] };
  }
  if (!input || input.kind !== 'claude-execution-attestation' || input.version !== 1 || input.runtime !== policy.runtime || !phases.has(input.phase)) {
    return { decision: 'BLOCK', phase: input?.phase ?? null, reasons: ['invalid-claude-execution-attestation'] };
  }

  const repository = input.repository;
  if (!repository || !/^[a-f0-9]{40}$/.test(repository.baseRevision ?? '') ||
      !(repository.resultRevision === 'pending' || /^[a-f0-9]{40}$/.test(repository.resultRevision ?? '')) ||
      typeof repository.worktree !== 'string' || !repository.worktree.trim()) reasons.push('repository-attestation-invalid');

  const objective = input.objective;
  if (!objective || objective.status !== 'clear' || typeof objective.statement !== 'string' || !objective.statement.trim() ||
      !uniqueStrings(objective.acceptanceCriteria) || instant(objective.confirmedAt) === null) reasons.push('objective-not-clear');

  const plan = input.plan;
  const usedUltraplan = plan?.method === policy.skills.plan && validReceipt(plan, policy.skills.plan);
  const usedFallback = plan?.method === policy.planFallback && typeof plan.fallbackReason === 'string' && plan.fallbackReason.trim();
  if (!plan || (!usedUltraplan && !usedFallback) || !uniqueStrings(plan.workstreams) || instant(plan.completedAt) === null) reasons.push('plan-not-complete');

  const goal = input.goal;
  if (!validReceipt(goal, policy.skills.goal) || typeof goal.id !== 'string' || !goal.id.trim() || instant(goal.startedAt) === null ||
      !['active', 'complete'].includes(goal.status)) reasons.push('goal-not-active');

  const agents = input.agents;
  if (!validReceipt(agents, policy.skills.agents) || !uniqueStrings(agents.assignments) || !uniqueStrings(agents.workerIds) || instant(agents.dispatchedAt) === null ||
      !['dispatched', 'complete'].includes(agents.status)) reasons.push('agents-not-dispatched');

  const before = input.graphify?.before;
  if (!before || before.status !== 'PASS' || instant(before.updatedAt) === null || !Number.isInteger(before.nodeCount) || before.nodeCount < 1 ||
      !sha256Pattern.test(before.indexSha256 ?? '') || !uniqueStrings(before.queries) || !uniqueStrings(before.anchors)) reasons.push('graphify-before-missing');

  const orderedStart = [objective?.confirmedAt, plan?.completedAt, goal?.startedAt, before?.updatedAt, agents?.dispatchedAt].map(instant);
  if (orderedStart.some(value => value === null) || orderedStart.some((value, index) => index > 0 && value < orderedStart[index - 1])) reasons.push('start-sequence-invalid');

  if (input.phase === 'complete') {
    const after = input.graphify?.after;
    if (agents?.status !== 'complete' || instant(agents?.completedAt) === null) reasons.push('agents-not-complete');
    if (!after || after.status !== 'PASS' || instant(after.updatedAt) === null || !Number.isInteger(after.nodeCount) || after.nodeCount < 1 ||
        !sha256Pattern.test(after.indexSha256 ?? '') || !uniqueStrings(after.queries) || !uniqueStrings(after.anchors)) reasons.push('graphify-after-missing');
    const review = input.review;
    if (!validReceipt(review, policy.skills.review) || review.status !== 'passed' || review.unresolvedFindings !== 0 ||
        instant(review.completedAt) === null || !uniqueStrings(review.reviewedScopes) || typeof review.reviewerId !== 'string' ||
        !review.reviewerId.trim() || agents?.workerIds?.includes(review.reviewerId)) reasons.push('peer-review-not-passed');
    if (goal?.status !== 'complete' || instant(goal?.completedAt) === null) reasons.push('goal-not-complete');
    if (!Array.isArray(input.evidence) || !input.evidence.length || input.evidence.some(item =>
      !item || typeof item.command !== 'string' || !item.command.trim() || item.exitCode !== 0 || !sha256Pattern.test(item.resultSha256 ?? ''))) {
      reasons.push('completion-evidence-missing');
    }
    const orderedEnd = [agents?.completedAt, after?.updatedAt, review?.completedAt, goal?.completedAt].map(instant);
    if (orderedEnd.some(value => value === null) || orderedEnd.some((value, index) => index > 0 && value < orderedEnd[index - 1]) ||
        (orderedStart.at(-1) !== null && orderedEnd[0] < orderedStart.at(-1))) reasons.push('completion-sequence-invalid');
  }

  return {
    decision: reasons.length ? 'BLOCK' : input.phase === 'complete' ? 'COMPLETE' : 'READY_TO_START',
    phase: input.phase,
    reasons: reasons.length ? [...new Set(reasons)].sort() : ['claude-governed-execution-satisfied'],
    objective: objective?.statement ?? null,
    goalId: goal?.id ?? null,
    planMethod: plan?.method ?? null
  };
}

async function main() {
  const [attestationPath, policyPath = 'inventory/claude-execution-policy.json'] = process.argv.slice(2);
  if (!attestationPath) throw new Error('Usage: node tools/claude-execution-gate.mjs <attestation.json> [policy.json]');
  const [input, policy] = await Promise.all([
    readFile(resolve(attestationPath), 'utf8').then(JSON.parse),
    readFile(resolve(policyPath), 'utf8').then(JSON.parse)
  ]);
  const result = evaluateClaudeExecution(input, policy);
  console.log(JSON.stringify(result, null, 2));
  const expected = input.phase === 'complete' ? 'COMPLETE' : 'READY_TO_START';
  if (result.decision !== expected) process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
