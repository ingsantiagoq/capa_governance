import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { transition } from './context-broker.mjs';
import { evaluateGovernanceReadiness } from './governance-readiness-gate.mjs';
import { evaluatePoGovernance, loadPoCatalog } from './po-governance-gate.mjs';

const decisionByState = {
  ready: 'GO',
  expand: 'NEEDS_EVIDENCE',
  escalate: 'ESCALATE',
  block: 'BLOCK'
};

export function evaluateProductDecision(input, catalog) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || !input.request || !input.facts || !catalog) {
    return { decision: 'BLOCK', reasons: ['invalid-po-request'] };
  }
  const catalogDecision = evaluatePoGovernance(catalog);
  if (catalogDecision.decision !== 'CONTROLLED') {
    return { decision: 'BLOCK', reasons: catalogDecision.reasons, stage: 'catalog-integrity' };
  }

  const { domain, capability, action, impactedDomains } = input.request;
  const readiness = evaluateGovernanceReadiness({
    registry: catalog.registry,
    expertManifests: catalog.expertManifests,
    capabilityManifests: catalog.capabilityManifests,
    request: { domain, capability, action, impactedDomains },
    evaluatedAt: catalog.evaluatedAt
  });
  if (readiness.decision !== 'READY') {
    return { decision: 'BLOCK', reasons: readiness.reasons, stage: 'authority-readiness' };
  }

  const routed = transition('ready', input.facts, { ...input.request, experts: catalog.expertManifests });
  const expert = catalog.expertManifests.find(item => item.id === routed.primaryExpert);
  const decision = decisionByState[routed.state] ?? 'BLOCK';
  return {
    decision,
    reasons: [routed.reason],
    stage: 'product-deliberation',
    primaryExpert: routed.primaryExpert,
    handoffTargets: routed.expertDecision?.targets ?? [],
    action: routed.action,
    productBasis: expert ? {
      bestVersion: expert.northStar.bestVersion,
      businessOutcomes: expert.northStar.businessOutcomes,
      invariants: expert.northStar.invariants,
      absoluteProhibitions: expert.prohibitedActions.absolute,
      approvalBoundaries: expert.prohibitedActions.withoutApproval,
      requiredGates: expert.enforcement.gates.map(gate => gate.id)
    } : null,
    ubpRevision: readiness.ubpRevision,
    approvedRevision: readiness.approvedRevision
  };
}

async function main() {
  const [requestPath] = process.argv.slice(2);
  if (!requestPath) throw new Error('Usage: node tools/po-decision.mjs <po-request.json>');
  const input = JSON.parse(await readFile(resolve(requestPath), 'utf8'));
  const catalog = await loadPoCatalog(input.evaluatedAt);
  const result = evaluateProductDecision(input, catalog);
  console.log(JSON.stringify(result, null, 2));
  if (result.decision === 'BLOCK') process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
