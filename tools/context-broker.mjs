import { validateManifest } from './validate-capability-manifests.mjs';

// Pure protocol reference. Evidence is supplied by the consumer, never inferred
// here from prose. Missing facts fail closed; ready does not execute operations.
function transitionV1(previous, facts) {
  const states = ['ready', 'expand', 'escalate', 'block'];
  if (!states.includes(previous)) throw new TypeError('Invalid previous state');
  const bools = ['manifestValid', 'policyDenied', 'approvalRequired', 'approvalGranted', 'decisionRequired', 'contextSufficient', 'graphAvailable', 'graphAttempted', 'sourceAllowed', 'sourceAttempted'];
  const keys = [...bools, 'route', 'expansions', 'maxExpansions'];
  if (!facts || Object.keys(facts).some(k => !keys.includes(k)) || bools.some(k => typeof facts[k] !== 'boolean') || !['matched', 'ambiguous', 'missing'].includes(facts.route) || !Number.isInteger(facts.expansions) || facts.expansions < 0 || !Number.isInteger(facts.maxExpansions) || facts.maxExpansions < 1 || facts.maxExpansions > 3 || (facts.sourceAttempted && !facts.graphAttempted) || (facts.expansions > 0 && !facts.graphAttempted)) {
    return { state: 'block', action: 'none', reason: 'invalid-facts' };
  }
  const result = (state, action, reason) => ({ state, action, reason });
  if (facts.route === 'missing' || !facts.manifestValid) return result('block', 'none', 'unpublished-or-invalid');
  if (facts.policyDenied) return result('block', 'none', 'restriction');
  if (facts.approvalRequired && !facts.approvalGranted) return result('block', 'none', 'approval-missing');
  if (facts.route === 'ambiguous' || facts.decisionRequired) return result('escalate', 'handoff', 'decision-required');
  if (facts.contextSufficient) return result('ready', 'use-pack', 'sufficient');
  if (facts.graphAvailable && !facts.sourceAttempted && facts.expansions < facts.maxExpansions) return result('expand', 'graphify', 'context-gap');
  if (facts.graphAttempted && facts.sourceAllowed && !facts.sourceAttempted) return result('expand', 'source', 'graph-insufficient');
  return result('escalate', 'handoff', 'retrieval-exhausted');
}

// v2 receives a normalized intent and verified, action-scoped approvals.
// Omitting expertContext preserves the exact v1 input/output contract.
export function transition(previous, facts, expertContext) {
  const base = transitionV1(previous, facts);
  if (expertContext === undefined) return base;
  const output = (result, primaryExpert, status, targets = []) => ({
    ...result, primaryExpert, expertDecision: { status, targets }
  });
  const stop = (state, reason, primary = null, targets = []) => output(
    { state, action: state === 'block' ? 'none' : 'handoff', reason }, primary, reason, targets);
  // A v1 block always wins; expert selection cannot relax capability policy.
  if (base.state === 'block') return output(base, null, 'capability-blocked');
  const c = expertContext;
  const slug = value => typeof value === 'string' && /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value);
  const list = value => Array.isArray(value) && value.every(slug) && new Set(value).size === value.length;
  const keys = ['domain', 'capability', 'action', 'impactedDomains', 'risks', 'approvedActions', 'experts'];
  if (!c || typeof c !== 'object' || Array.isArray(c) || Object.keys(c).some(k => !keys.includes(k)) ||
      !slug(c.domain) || !slug(c.capability) || !slug(c.action) || !list(c.impactedDomains) ||
      !c.impactedDomains.includes(c.domain) || !list(c.risks) || !list(c.approvedActions) ||
      !Array.isArray(c.experts) || c.experts.some(e => e?.kind !== 'domain-expert' || validateManifest(e).length) ||
      new Set(c.experts.map(e => e.id)).size !== c.experts.length) {
    return stop('block', 'invalid-expert-facts');
  }
  const candidates = c.experts.filter(e => e.domain === c.domain && e.coveredCapabilities.includes(c.capability));
  // Fixed protocol roles are fallback authorities, never invented domain experts.
  if (candidates.length !== 1) return stop('escalate', candidates.length ? 'ambiguous-expert' : 'missing-expert', null, ['architect']);
  const expert = candidates[0];
  if (expert.prohibitedActions.absolute.includes(c.action)) return stop('block', 'expert-restriction', expert.id);
  if (expert.prohibitedActions.withoutApproval.includes(c.action) && !c.approvedActions.includes(c.action)) {
    return stop('block', 'expert-approval-missing', expert.id);
  }
  const risks = [...new Set([...c.risks, ...(c.impactedDomains.some(d => d !== c.domain) ? ['cross-domain-impact'] : [])])];
  if (risks.length) {
    const targets = [...new Set(risks.flatMap(risk => expert.escalationTriggers.find(t => t.risk === risk)?.targets ?? expert.handoffTargets))].sort();
    return stop('escalate', 'expert-risk-or-cross-domain', expert.id, targets);
  }
  // Enforce the stricter published retrieval budget; do not trust a larger input.
  const bounded = transitionV1(previous, { ...facts, maxExpansions: Math.min(facts.maxExpansions, expert.retrieval.maxExpansions) });
  return output(bounded, expert.id, bounded.state === 'escalate' ? 'handoff-required' : 'selected', bounded.state === 'escalate' ? expert.handoffTargets : []);
}
