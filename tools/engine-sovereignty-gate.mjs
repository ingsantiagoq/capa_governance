import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export const requiredStages = [
  'control-plane-publication',
  'unique-resolution',
  'manifest-integrity',
  'tenant-version-pin',
  'engine-consumption',
  'explicit-upgrade',
  'multi-country-same-engine',
  'fictitious-country',
  'no-runtime-country-fallback',
  'accounting-handoff'
];

const stageStatuses = new Set(['PASS', 'BLOCK']);
const classifications = new Set(['universal-primitive', 'country-pack-data', 'legal-adapter']);

function block(reasons, stages = {}) {
  return { decision: 'BLOCK', reasons: [...new Set(reasons)].sort(), stages };
}

function validEvidence(item) {
  return item && typeof item === 'object' && !Array.isArray(item) &&
    Object.keys(item).every(key => ['reference', 'command', 'result', 'exitCode', 'resultSha256', 'executedAt', 'ubpRevision'].includes(key)) &&
    typeof item.reference === 'string' && item.reference.trim().length > 0 &&
    typeof item.command === 'string' && item.command.trim().length > 0 &&
    typeof item.result === 'string' && item.result.trim().length > 0 &&
    item.exitCode === 0 && /^[a-f0-9]{64}$/.test(item.resultSha256) &&
    Number.isFinite(Date.parse(item.executedAt)) &&
    typeof item.ubpRevision === 'string' && item.ubpRevision.trim().length > 0;
}

export function evaluateEngineSovereignty(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return block(['invalid-input']);
  const allowed = ['kind', 'version', 'engine', 'ubpRevision', 'evaluatedAt', 'stages', 'countryArtifacts'];
  if (Object.keys(input).some(key => !allowed.includes(key))) return block(['invalid-input']);
  if (input.kind !== 'engine-sovereignty-evidence' || input.version !== 1 ||
      typeof input.engine !== 'string' || !input.engine ||
      typeof input.ubpRevision !== 'string' || !input.ubpRevision ||
      !Number.isFinite(Date.parse(input.evaluatedAt)) ||
      !Array.isArray(input.stages) || !Array.isArray(input.countryArtifacts)) {
    return block(['invalid-input']);
  }

  const reasons = [];
  const stages = {};
  const seen = new Set();
  for (const stage of input.stages) {
    if (!stage || typeof stage !== 'object' || Object.keys(stage).some(key => !['id', 'status', 'evidence'].includes(key)) ||
        !requiredStages.includes(stage.id) || seen.has(stage.id) ||
        !stageStatuses.has(stage.status) || !Array.isArray(stage.evidence)) {
      reasons.push('invalid-stage');
      continue;
    }
    seen.add(stage.id);
    const evidenceValid = stage.status === 'BLOCK' || stage.evidence.length > 0 && stage.evidence.every(validEvidence) &&
      stage.evidence.every(item => item.ubpRevision === input.ubpRevision);
    stages[stage.id] = stage.status;
    if (!evidenceValid) reasons.push(`${stage.id}:missing-or-stale-executable-evidence`);
    if (stage.status !== 'PASS') reasons.push(`${stage.id}:not-demonstrated`);
  }
  for (const id of requiredStages) if (!seen.has(id)) reasons.push(`${id}:missing-stage`);

  for (const artifact of input.countryArtifacts) {
    if (!artifact || typeof artifact !== 'object' ||
        Object.keys(artifact).some(key => !['reference', 'classification', 'justification'].includes(key)) ||
        typeof artifact.reference !== 'string' || !artifact.reference ||
        !classifications.has(artifact.classification) ||
        typeof artifact.justification !== 'string' || !artifact.justification) {
      reasons.push('unclassified-country-artifact');
    }
  }

  if (reasons.length) return block(reasons, stages);
  return {
    decision: 'READY',
    reasons: ['engine-sovereignty-demonstrated'],
    engine: input.engine,
    ubpRevision: input.ubpRevision,
    stages
  };
}

async function main() {
  const [path] = process.argv.slice(2);
  if (!path) throw new Error('Usage: node tools/engine-sovereignty-gate.mjs <evidence-bundle.json>');
  const result = evaluateEngineSovereignty(JSON.parse(await readFile(path, 'utf8')));
  console.log(JSON.stringify(result, null, 2));
  if (result.decision !== 'READY') process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
