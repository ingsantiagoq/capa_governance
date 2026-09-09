import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { validate, validateManifest, registrySchema } from './validate-capability-manifests.mjs';

const slugPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const activeFields = [
  'accountableOwner',
  'backupOwner',
  'approvedBy',
  'approvedRevision',
  'manifestSha256',
  'reviewDueAt',
  'seedGraphRevision',
  'seedVerificationSha256'
];

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function sha256(value) {
  return createHash('sha256').update(canonical(value)).digest('hex');
}

export function seedVerificationSha256(graphRevision, seedNodes) {
  return sha256({ graphRevision, seedNodes });
}

function validRequest(request) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) return false;
  const keys = ['domain', 'capability', 'action', 'impactedDomains'];
  if (Object.keys(request).some(key => !keys.includes(key)) || keys.some(key => !Object.hasOwn(request, key))) return false;
  const slugs = value => Array.isArray(value) && value.length > 0 && value.every(item => slugPattern.test(item)) && new Set(value).size === value.length;
  return slugPattern.test(request.domain) && slugPattern.test(request.capability) && slugPattern.test(request.action) &&
    slugs(request.impactedDomains) && request.impactedDomains.includes(request.domain);
}

function activeEvidenceErrors(entry, manifest, registry, evaluatedAt, prefix) {
  const errors = [];
  if (!entry) return [`${prefix}:registry-entry-missing`];
  if (entry.status !== 'active') return [`${prefix}:expert-not-active`];
  for (const field of activeFields) if (!Object.hasOwn(entry, field)) errors.push(`${prefix}:missing-${field}`);
  if (errors.length) return errors;
  if (entry.accountableOwner === entry.backupOwner) errors.push(`${prefix}:owner-and-backup-must-differ`);
  if (entry.manifestSha256 !== sha256(manifest)) errors.push(`${prefix}:manifest-digest-mismatch`);
  if (registry.graphSourceRevision !== registry.ubpRevision) errors.push(`${prefix}:graph-stale`);
  if (entry.seedGraphRevision !== registry.ubpRevision) errors.push(`${prefix}:seed-graph-stale`);
  if (entry.seedVerificationSha256 !== seedVerificationSha256(entry.seedGraphRevision, manifest.seedNodes)) {
    errors.push(`${prefix}:seed-verification-mismatch`);
  }
  const due = Date.parse(entry.reviewDueAt);
  const at = Date.parse(evaluatedAt);
  if (!Number.isFinite(due) || !Number.isFinite(at)) errors.push(`${prefix}:invalid-review-date`);
  else if (at > due) errors.push(`${prefix}:review-expired`);
  return errors;
}

export function evaluateGovernanceReadiness(input) {
  const block = reasons => ({ decision: 'BLOCK', reasons: [...new Set(reasons)].sort() });
  if (!input || typeof input !== 'object' || Array.isArray(input)) return block(['invalid-input']);
  const allowed = ['registry', 'expertManifests', 'capabilityManifests', 'request', 'evaluatedAt'];
  if (Object.keys(input).some(key => !allowed.includes(key)) || allowed.some(key => !Object.hasOwn(input, key))) return block(['invalid-input']);
  const { registry, expertManifests, capabilityManifests, request, evaluatedAt } = input;
  const registryErrors = validate(registry, registrySchema);
  if (registryErrors.length) return block(registryErrors.map(error => `invalid-registry:${error}`));
  if (!validRequest(request) || !Number.isFinite(Date.parse(evaluatedAt))) return block(['invalid-request']);
  if (!Array.isArray(expertManifests) || !Array.isArray(capabilityManifests)) return block(['invalid-catalog']);

  const reasons = [];
  for (const manifest of expertManifests) {
    for (const error of validateManifest(manifest)) reasons.push(`invalid-expert-manifest:${manifest?.id ?? 'unknown'}:${error}`);
  }
  for (const manifest of capabilityManifests) {
    for (const error of validate(manifest)) reasons.push(`invalid-capability-manifest:${manifest?.capability?.id ?? 'unknown'}:${error}`);
  }
  const duplicate = values => values.some((value, index) => values.indexOf(value) !== index);
  if (duplicate(expertManifests.map(item => item?.id))) reasons.push('duplicate-expert-id');
  if (duplicate(capabilityManifests.map(item => item?.capability?.id))) reasons.push('duplicate-capability-id');
  if (duplicate(registry.entries.map(item => item.expertId))) reasons.push('duplicate-registry-entry');
  if (reasons.length) return block(reasons);

  const primaryCandidates = expertManifests.filter(manifest =>
    manifest.domain === request.domain && manifest.coveredCapabilities.includes(request.capability));
  if (primaryCandidates.length !== 1) return block([primaryCandidates.length ? 'ambiguous-primary-expert' : 'missing-primary-expert']);
  const capabilityCandidates = capabilityManifests.filter(manifest => manifest.capability.id === request.capability);
  if (capabilityCandidates.length !== 1) return block([capabilityCandidates.length ? 'ambiguous-capability' : 'missing-capability']);

  const primary = primaryCandidates[0];
  const primaryEntry = registry.entries.find(entry => entry.expertId === primary.id);
  reasons.push(...activeEvidenceErrors(primaryEntry, primary, registry, evaluatedAt, `primary:${primary.id}`));
  if (primaryEntry?.blockedActions?.includes(request.action)) reasons.push(`primary:${primary.id}:action-coverage-gap`);

  for (const domain of request.impactedDomains.filter(domain => domain !== request.domain)) {
    const impactedCandidates = expertManifests.filter(manifest => manifest.domain === domain);
    if (impactedCandidates.length !== 1) {
      reasons.push(`${domain}:${impactedCandidates.length ? 'ambiguous-impacted-expert' : 'missing-impacted-expert'}`);
      continue;
    }
    const impacted = impactedCandidates[0];
    const impactedEntry = registry.entries.find(entry => entry.expertId === impacted.id);
    reasons.push(...activeEvidenceErrors(impactedEntry, impacted, registry, evaluatedAt, `impacted:${impacted.id}`));
  }

  if (reasons.length) return block(reasons);
  return {
    decision: 'READY',
    reasons: ['governance-evidence-satisfied'],
    primaryExpert: primary.id,
    capability: request.capability,
    ubpRevision: registry.ubpRevision,
    graphSourceRevision: registry.graphSourceRevision,
    approvedRevision: primaryEntry.approvedRevision
  };
}

async function main() {
  const [path] = process.argv.slice(2);
  if (!path) throw new Error('Usage: node tools/governance-readiness-gate.mjs <evidence-bundle.json>');
  const input = JSON.parse(await readFile(path, 'utf8'));
  const result = evaluateGovernanceReadiness(input);
  console.log(JSON.stringify(result, null, 2));
  if (result.decision !== 'READY') process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
