import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { evaluateEngineSovereignty } from './engine-sovereignty-gate.mjs';
import { evaluateGovernanceReadiness, sha256 } from './governance-readiness-gate.mjs';
import { validate, validateManifest, validateRegistry } from './validate-capability-manifests.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function block(reasons) {
  return { decision: 'BLOCK', reasons: [...new Set(reasons)].sort() };
}

function validPolicy(policy) {
  return policy && policy.kind === 'po-governance-policy' && policy.version === 1 &&
    Array.isArray(policy.requiredReadyExperts) && new Set(policy.requiredReadyExperts).size === policy.requiredReadyExperts.length &&
    policy.requiredReadyExperts.every(id => typeof id === 'string' && id.length > 0) &&
    policy.sovereigntyEvidence && typeof policy.sovereigntyEvidence === 'object' && !Array.isArray(policy.sovereigntyEvidence);
}

export function evaluatePoGovernance({ registry, expertManifests, capabilityManifests, seedAudit, sovereigntyEvidence, policy, evaluatedAt }) {
  if (!validPolicy(policy) || !registry || !Array.isArray(registry.entries) || !Array.isArray(expertManifests) ||
      !Array.isArray(capabilityManifests) || !seedAudit || !Array.isArray(seedAudit.experts) ||
      !Number.isFinite(Date.parse(evaluatedAt))) return block(['invalid-po-catalog']);

  const structuralReasons = [];
  structuralReasons.push(...validateRegistry(registry).map(reason => `invalid-registry:${reason}`));
  for (const manifest of expertManifests) structuralReasons.push(...validateManifest(manifest).map(reason => `invalid-expert:${manifest?.id ?? 'unknown'}:${reason}`));
  for (const manifest of capabilityManifests) structuralReasons.push(...validate(manifest).map(reason => `invalid-capability:${manifest?.capability?.id ?? 'unknown'}:${reason}`));
  const duplicate = values => values.some((value, index) => values.indexOf(value) !== index);
  if (duplicate(expertManifests.map(item => item?.id))) structuralReasons.push('duplicate-expert-id');
  if (duplicate(capabilityManifests.map(item => item?.capability?.id))) structuralReasons.push('duplicate-capability-id');
  if (duplicate(seedAudit.experts.map(item => item?.expertId))) structuralReasons.push('duplicate-seed-audit-expert');
  if (structuralReasons.length) return block(structuralReasons);

  const manifestById = new Map(expertManifests.map(item => [item.id, item]));
  const seedById = new Map(seedAudit.experts.map(item => [item.expertId, item]));
  const capabilityById = new Map(capabilityManifests.map(item => [item.capability?.id, item]));
  const experts = [];
  const catalogReasons = [];

  if (registry.ubpRevision !== registry.graphSourceRevision || registry.ubpRevision !== seedAudit.graphRevision) {
    catalogReasons.push('catalog-revision-drift');
  }
  for (const manifest of expertManifests) {
    if (!registry.entries.some(entry => entry.expertId === manifest.id)) catalogReasons.push(`${manifest.id}:manifest-without-registry-entry`);
  }
  for (const audited of seedAudit.experts) {
    if (!manifestById.has(audited.expertId)) catalogReasons.push(`${audited.expertId}:seed-audit-without-manifest`);
  }

  for (const entry of registry.entries) {
    const manifest = manifestById.get(entry.expertId);
    const reasons = [];
    let sovereignty = null;
    if (!manifest) reasons.push('manifest-not-published');
    const seed = seedById.get(entry.expertId);
    if (manifest) {
      if (!seed) reasons.push('seed-audit-missing');
      else {
        if (seed.manifestSha256 !== sha256(manifest)) reasons.push('seed-manifest-digest-mismatch');
        if (seed.decision !== 'READY') reasons.push('seed-audit-not-ready');
        if (!seed.seedVerificationSha256) reasons.push('seed-attestation-missing');
      }
    }

    if (entry.status !== 'active') reasons.push(`expert-${entry.status}`);
    if (entry.status === 'active' && manifest) {
      const capability = capabilityById.get(manifest.domain);
      if (!capability) reasons.push('primary-capability-not-published');
      else {
        const readiness = evaluateGovernanceReadiness({
          registry,
          expertManifests,
          capabilityManifests,
          request: { domain: manifest.domain, capability: manifest.domain, action: 'govern-product-change', impactedDomains: [manifest.domain] },
          evaluatedAt
        });
        if (readiness.decision !== 'READY') reasons.push(...readiness.reasons.map(reason => `authority:${reason}`));
      }
    }

    const evidence = sovereigntyEvidence[entry.expertId];
    if (Object.hasOwn(policy.sovereigntyEvidence, entry.expertId)) {
      if (!evidence) reasons.push('sovereignty-evidence-missing');
      else {
        sovereignty = evaluateEngineSovereignty(evidence);
        if (sovereignty.decision !== 'READY') reasons.push(...sovereignty.reasons.map(reason => `sovereignty:${reason}`));
        if (evidence.ubpRevision !== registry.ubpRevision) reasons.push('sovereignty-revision-drift');
      }
    }

    const decision = reasons.length ? 'BLOCK' : 'READY';
    if (entry.status === 'active' && decision !== 'READY') catalogReasons.push(`${entry.expertId}:active-without-complete-evidence`);
    if (entry.status !== 'active' && decision === 'READY') catalogReasons.push(`${entry.expertId}:ready-without-active-authority`);
    experts.push({ expertId: entry.expertId, domain: manifest?.domain ?? null, status: entry.status, decision, reasons: [...new Set(reasons)].sort(), sovereignty: sovereignty?.decision ?? null });
  }

  for (const expertId of policy.requiredReadyExperts) {
    const result = experts.find(item => item.expertId === expertId);
    if (!result) catalogReasons.push(`${expertId}:required-expert-missing`);
    else if (result.decision !== 'READY') catalogReasons.push(`${expertId}:required-expert-not-ready`);
  }

  return {
    decision: catalogReasons.length ? 'BLOCK' : 'CONTROLLED',
    reasons: catalogReasons.length ? [...new Set(catalogReasons)].sort() : ['po-authority-consistent'],
    ubpRevision: registry.ubpRevision,
    summary: {
      ready: experts.filter(item => item.decision === 'READY').length,
      blocked: experts.filter(item => item.decision === 'BLOCK').length,
      total: experts.length
    },
    experts
  };
}

async function loadJson(path) {
  return JSON.parse(await readFile(resolve(root, path), 'utf8'));
}

const catalogPath = value => typeof value === 'string' && value.length > 0 &&
  !value.startsWith('/') && !value.split('/').includes('..');

export function validApprovedCatalog(catalog) {
  const allowed = new Set(['kind', 'version', 'catalogId', 'ubpRevision', 'approvedBy', 'registry', 'seedAudit', 'policy', 'expertManifests', 'capabilityManifests', 'sovereigntyEvidence']);
  if (!catalog || catalog.kind !== 'approved-domain-catalog' || catalog.version !== 1 ||
      Object.keys(catalog).some(key => !allowed.has(key)) || Object.keys(catalog).length !== allowed.size ||
      typeof catalog.catalogId !== 'string' || !catalog.catalogId ||
      typeof catalog.ubpRevision !== 'string' || !catalog.ubpRevision ||
      typeof catalog.approvedBy !== 'string' || !catalog.approvedBy ||
      !catalogPath(catalog.registry) || !catalogPath(catalog.seedAudit) || !catalogPath(catalog.policy) ||
      !Array.isArray(catalog.expertManifests) || !catalog.expertManifests.length ||
      !Array.isArray(catalog.capabilityManifests) || !catalog.capabilityManifests.length ||
      !catalog.expertManifests.every(path => catalogPath(path) && path.startsWith('catalog/ubp/experts/') && path.endsWith('.json')) ||
      !catalog.capabilityManifests.every(path => catalogPath(path) && path.startsWith('catalog/ubp/capabilities/') && path.endsWith('.json')) ||
      new Set(catalog.expertManifests).size !== catalog.expertManifests.length ||
      new Set(catalog.capabilityManifests).size !== catalog.capabilityManifests.length ||
      !catalog.sovereigntyEvidence || typeof catalog.sovereigntyEvidence !== 'object' || Array.isArray(catalog.sovereigntyEvidence) ||
      !Object.values(catalog.sovereigntyEvidence).every(catalogPath)) return false;
  return true;
}

export async function loadPoCatalog(evaluatedAt = new Date().toISOString()) {
  const approvedCatalog = await loadJson('catalog/ubp/approved-catalog.json');
  if (!validApprovedCatalog(approvedCatalog)) throw new TypeError('Invalid approved UBP catalog');
  const [registry, seedAudit, policy, expertManifests, capabilityManifests] = await Promise.all([
    loadJson(approvedCatalog.registry),
    loadJson(approvedCatalog.seedAudit),
    loadJson(approvedCatalog.policy),
    Promise.all(approvedCatalog.expertManifests.map(loadJson)),
    Promise.all(approvedCatalog.capabilityManifests.map(loadJson))
  ]);
  const activeIds = registry.entries.filter(entry => entry.status === 'active').map(entry => entry.expertId).sort();
  const catalogIds = expertManifests.map(manifest => manifest.id).sort();
  if (approvedCatalog.ubpRevision !== registry.ubpRevision || !isDeepStrictEqual(activeIds, catalogIds)) {
    throw new TypeError('Approved catalog does not match active registry authority');
  }
  if (!isDeepStrictEqual(approvedCatalog.sovereigntyEvidence, policy.sovereigntyEvidence)) {
    throw new TypeError('Approved catalog sovereignty evidence does not match PO policy');
  }
  const sovereigntyEvidence = Object.fromEntries(await Promise.all(Object.entries(approvedCatalog.sovereigntyEvidence).map(async ([id, path]) => [id, await loadJson(path)])));
  return { registry, expertManifests, capabilityManifests, seedAudit, sovereigntyEvidence, policy, evaluatedAt, approvedCatalog };
}

async function main() {
  const result = evaluatePoGovernance(await loadPoCatalog());
  console.log(JSON.stringify(result, null, 2));
  if (result.decision !== 'CONTROLLED') process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
