import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validate, validateRegistry, assertSupported } from '../tools/validate-capability-manifests.mjs';
import { transition } from '../tools/context-broker.mjs';
import { evaluateGovernanceReadiness, seedVerificationSha256, sha256 } from '../tools/governance-readiness-gate.mjs';
import { evaluateEngineSovereignty, requiredStages } from '../tools/engine-sovereignty-gate.mjs';
import { auditExpertSeeds, resolveSeed } from '../tools/audit-expert-seeds.mjs';
import { evaluatePoGovernance, loadPoCatalog } from '../tools/po-governance-gate.mjs';
import { evaluateProductDecision } from '../tools/po-decision.mjs';
import { evaluateClaudeExecution } from '../tools/claude-execution-gate.mjs';

const examples = await Promise.all(['inventory', 'control-plane'].map(name => readFile(new URL(`../examples/${name}.manifest.json`, import.meta.url), 'utf8').then(JSON.parse)));
const facts = { route: 'matched', manifestValid: true, policyDenied: false, approvalRequired: false, approvalGranted: false, decisionRequired: false, contextSufficient: true, graphAvailable: true, graphAttempted: false, expansions: 0, maxExpansions: 1, sourceAllowed: true, sourceAttempted: false };

test('both manifests pass; every required top-level and policy field is enforced', () => {
  for (const example of examples) {
    assert.deepEqual(validate(example), []);
    for (const key of Object.keys(example)) {
      const bad = structuredClone(example); delete bad[key];
      assert.ok(validate(bad).length, key);
    }
    for (const key of Object.keys(example.governance)) {
      const bad = structuredClone(example); bad.governance[key] = [];
      assert.ok(validate(bad).length, key);
      delete bad.governance[key]; assert.ok(validate(bad).length, key);
    }
  }
});

test('schema rejects unsafe retrieval, malformed fields and drift', () => {
  const mutations = [
    m => { m.retrieval.seedNodes = []; },
    m => { m.retrieval.seedNodes = [' ']; },
    m => { m.retrieval.seedNodes = ['a', 'a']; },
    m => { m.retrieval.order = ['graphify', 'manifest', 'source']; },
    m => { m.retrieval.sourcePolicy = 'always'; },
    m => { m.retrieval.maxExpansions = 0; },
    m => { m.retrieval.maxExpansions = 1.5; },
    m => { m.retrieval.extra = true; },
    m => { m.services = [null]; },
    m => { m.capability.id = 'Not a slug'; },
    m => { m.capacity = m.capability; },
    m => { m.governance = null; },
  ];
  for (const mutate of mutations) {
    const bad = structuredClone(examples[0]); mutate(bad); assert.ok(validate(bad).length);
  }
  assert.throws(() => assertSupported({ type: 'object', properties: { x: { enum: ['x'] } } }), /Unsupported/);
});

test('CLI fails on invalid JSON, schema violation, missing files and duplicate IDs', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'capa-governance-'));
  const cli = fileURLToPath(new URL('../tools/validate-capability-manifests.mjs', import.meta.url));
  const run = (...args) => spawnSync(process.execPath, [cli, ...args], { cwd: dir, encoding: 'utf8' });
  try {
    assert.equal(run().status, 0);
    const good = join(dir, 'good.json'); await writeFile(good, JSON.stringify(examples[0]));
    const bad = join(dir, 'bad.json'); await writeFile(bad, '{}');
    const broken = join(dir, 'broken.json'); await writeFile(broken, '{');
    for (const args of [[bad], [broken], [join(dir, 'absent.json')], [good, good]]) {
      const result = run(...args); assert.equal(result.status, 1); assert.match(result.stderr, /FAIL/);
    }
    assert.equal(run(good).status, 0);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('all prior states re-evaluate policy before sufficiency', () => {
  for (const previous of ['ready', 'expand', 'escalate', 'block']) {
    assert.equal(transition(previous, facts).state, 'ready');
    assert.equal(transition(previous, { ...facts, policyDenied: true, approvalGranted: true }).state, 'block');
    assert.equal(transition(previous, { ...facts, approvalRequired: true }).state, 'block');
    assert.equal(transition(previous, { ...facts, route: 'missing' }).state, 'block');
    assert.equal(transition(previous, { ...facts, manifestValid: false }).state, 'block');
    assert.equal(transition(previous, { ...facts, route: 'ambiguous' }).state, 'escalate');
    assert.equal(transition(previous, { ...facts, decisionRequired: true }).state, 'escalate');
  }
});

test('manifest -> graph -> source -> exhausted; new evidence can resolve gap', () => {
  const gap = { ...facts, contextSufficient: false };
  assert.deepEqual(transition('block', gap), { state: 'expand', action: 'graphify', reason: 'context-gap' });
  const expanded = { ...gap, graphAttempted: true, expansions: 1 };
  assert.equal(transition('expand', expanded).action, 'source');
  const read = { ...expanded, sourceAttempted: true };
  assert.equal(transition('expand', read).state, 'escalate');
  assert.equal(transition('escalate', { ...read, contextSufficient: true }).state, 'ready');
  assert.equal(transition('expand', { ...expanded, sourceAllowed: false }).state, 'escalate');
  assert.equal(transition('expand', { ...gap, graphAvailable: false }).state, 'escalate');
  assert.equal(transition('expand', { ...gap, graphAvailable: false, graphAttempted: true, expansions: 1 }).action, 'source');
});

test('missing and inconsistent facts fail closed; no implicit approval', () => {
  for (const key of Object.keys(facts)) {
    const bad = { ...facts }; delete bad[key]; assert.equal(transition('ready', bad).state, 'block', key);
  }
  for (const bad of [null, {}, { ...facts, sourceAttempted: true }, { ...facts, expansions: 1 }, { ...facts, maxExpansions: 4 }, { ...facts, surprise: true }]) {
    assert.equal(transition('ready', bad).reason, 'invalid-facts');
  }
  assert.throws(() => transition('unknown', facts));
  assert.equal(transition('block', { ...facts, approvalRequired: true, approvalGranted: true }).state, 'ready');
});

const ar = JSON.parse(await readFile(new URL('../examples/ar.expert.manifest.json', import.meta.url), 'utf8'));
const inventoryExpert = JSON.parse(await readFile(new URL('../examples/inventory.expert.manifest.json', import.meta.url), 'utf8'));
const ledgerExpert = JSON.parse(await readFile(new URL('../examples/ledger.expert.manifest.json', import.meta.url), 'utf8'));
const controlPlaneExpert = JSON.parse(await readFile(new URL('../examples/control-plane.expert.manifest.json', import.meta.url), 'utf8'));
const apExpert = JSON.parse(await readFile(new URL('../examples/ap.expert.manifest.json', import.meta.url), 'utf8'));
const taxExpert = JSON.parse(await readFile(new URL('../examples/tax.expert.manifest.json', import.meta.url), 'utf8'));
const { validateManifest } = await import('../tools/validate-capability-manifests.mjs');
const intent = { domain: 'ar', capability: 'ar', action: 'inspect-invoice', impactedDomains: ['ar'], risks: [], approvedActions: [], experts: [ar] };

test('expert schema requires all governance and retrieval declarations', () => {
  assert.deepEqual(validateManifest(ar), []);
  for (const key of Object.keys(ar)) {
    const bad = structuredClone(ar); delete bad[key];
    assert.ok(validateManifest(bad).length, key);
  }
  for (const key of ['scope', 'coveredCapabilities', 'seedNodes', 'escalationTriggers', 'handoffTargets']) {
    const bad = structuredClone(ar); bad[key] = [];
    assert.ok(validateManifest(bad).length, key);
  }
  for (const mutate of [m => m.escalationTriggers[0].targets.push('unknown'), m => m.seedNodes.push('drift'), m => m.prohibitedActions.absolute = [], m => m.escalationTriggers.shift()]) {
    const bad = structuredClone(ar); mutate(bad); assert.ok(validateManifest(bad).length);
  }
});

test('AR intent selects one primary; cross-domain and risk require handoff', () => {
  const selected = transition('block', facts, intent);
  assert.equal(selected.state, 'ready'); assert.equal(selected.primaryExpert, 'ar-expert');
  for (const previous of ['block', 'ready', 'expand', 'escalate']) {
    const crossed = transition(previous, facts, { ...intent, impactedDomains: ['ar', 'ledger'] });
    assert.equal(crossed.state, 'escalate'); assert.equal(crossed.primaryExpert, 'ar-expert');
    assert.deepEqual(crossed.expertDecision.targets, ['architect', 'reviewer']);
  }
  assert.deepEqual(transition('ready', facts, { ...intent, risks: ['electronic-invoicing'] }).expertDecision.targets, ['compliance', 'reviewer']);
  assert.equal(transition('ready', facts, { ...intent, risks: ['unknown-risk'] }).state, 'escalate');
});

test('prohibitions and action-scoped approvals precede handoff and readiness', () => {
  const posting = { ...intent, action: 'post-invoice', impactedDomains: ['ar', 'ledger'] };
  assert.equal(transition('ready', { ...facts, approvalGranted: true }, posting).state, 'block');
  assert.equal(transition('ready', facts, { ...posting, approvedActions: ['apply-receipt'] }).state, 'block');
  assert.equal(transition('block', facts, { ...posting, approvedActions: ['post-invoice'] }).state, 'escalate');
  assert.equal(transition('block', facts, { ...intent, action: 'post-invoice', approvedActions: ['post-invoice'] }).state, 'ready');
  assert.equal(transition('ready', facts, { ...intent, action: 'bypass-tenant-isolation', approvedActions: ['bypass-tenant-isolation'] }).state, 'block');
  assert.equal(transition('ready', { ...facts, policyDenied: true }, intent).state, 'block');
});

test('missing or ambiguous experts never manufacture a primary; malformed input blocks', () => {
  for (const changed of [{ experts: [] }, { domain: 'ap', impactedDomains: ['ap'] }, { capability: 'unknown' }, { experts: [ar, { ...ar, id: 'ar-other' }] }]) {
    const result = transition('ready', facts, { ...intent, ...changed });
    assert.equal(result.state, 'escalate'); assert.equal(result.primaryExpert, null);
    assert.deepEqual(result.expertDecision.targets, ['architect']);
  }
  for (const key of Object.keys(intent)) {
    const bad = { ...intent }; delete bad[key];
    assert.equal(transition('ready', facts, bad).state, 'block', key);
  }
  for (const bad of [null, {}, { ...intent, experts: [ar, ar] }, { ...intent, risks: [null] }, { ...intent, impactedDomains: [] }, { ...intent, experts: [{}] }]) {
    assert.equal(transition('ready', facts, bad).state, 'block');
  }
  assert.equal(transition('expand', { ...facts, contextSufficient: false, graphAttempted: true, expansions: 1, maxExpansions: 3 }, intent).action, 'source');
});

test('CLI accepts expert manifests and rejects duplicate expert IDs', () => {
  const cli = fileURLToPath(new URL('../tools/validate-capability-manifests.mjs', import.meta.url));
  const example = fileURLToPath(new URL('../examples/ar.expert.manifest.json', import.meta.url));
  assert.equal(spawnSync(process.execPath, [cli, example]).status, 0);
  assert.equal(spawnSync(process.execPath, [cli, example, example]).status, 1);
});


test('Inventory expert selects one primary and escalates market-sensitive cross-domain work', () => {
  assert.deepEqual(validateManifest(inventoryExpert), []);
  const inventoryIntent = {
    domain: 'inventory',
    capability: 'inventory',
    action: 'inspect-availability',
    impactedDomains: ['inventory'],
    risks: [],
    approvedActions: [],
    experts: [ar, inventoryExpert]
  };
  const selected = transition('block', facts, inventoryIntent);
  assert.equal(selected.state, 'ready');
  assert.equal(selected.primaryExpert, 'inventory-expert');
  assert.equal(selected.expertDecision.status, 'selected');

  const crossed = transition('ready', facts, { ...inventoryIntent, impactedDomains: ['inventory', 'ledger'] });
  assert.equal(crossed.state, 'escalate');
  assert.equal(crossed.primaryExpert, 'inventory-expert');
  assert.deepEqual(crossed.expertDecision.targets, ['architect', 'reviewer']);

  const costing = transition('ready', facts, { ...inventoryIntent, risks: ['costing-policy'] });
  assert.equal(costing.state, 'escalate');
  assert.deepEqual(costing.expertDecision.targets, ['architect', 'po', 'reviewer']);

  const blocked = transition('ready', facts, { ...inventoryIntent, action: 'apply-stock-adjustment' });
  assert.equal(blocked.state, 'block');
  assert.equal(blocked.reason, 'expert-approval-missing');
});


test('Cost center context routes through Ledger and Control Plane experts', () => {
  assert.deepEqual(validateManifest(ledgerExpert), []);
  assert.deepEqual(validateManifest(controlPlaneExpert), []);
  const experts = [ar, inventoryExpert, ledgerExpert, controlPlaneExpert];
  const ledgerIntent = {
    domain: 'ledger',
    capability: 'ledger',
    action: 'inspect-cost-center-dimension',
    impactedDomains: ['ledger', 'inventory', 'control-plane'],
    risks: ['cost-center-policy'],
    approvedActions: [],
    experts
  };
  const ledgerRoute = transition('ready', facts, ledgerIntent);
  assert.equal(ledgerRoute.state, 'escalate');
  assert.equal(ledgerRoute.primaryExpert, 'ledger-expert');
  assert.deepEqual(ledgerRoute.expertDecision.targets, ['architect', 'control-plane-expert', 'po', 'reviewer']);

  const policyIntent = {
    domain: 'control-plane',
    capability: 'control-plane',
    action: 'change-cost-center-policy',
    impactedDomains: ['control-plane', 'ledger', 'inventory'],
    risks: ['cost-center-policy'],
    approvedActions: [],
    experts
  };
  const policyRoute = transition('ready', facts, policyIntent);
  assert.equal(policyRoute.state, 'block');
  assert.equal(policyRoute.reason, 'expert-approval-missing');
});


test('expert manifests reference mandatory policies', () => {
  const requiredPolicies = new Set(['context-order', 'route-conformance', 'design-patterns', 'configuration-governance', 'tenant-boundaries', 'testing-gates', 'approval-boundaries', 'escalation-recommendations', 'domain-deliberation']);
  for (const expert of [ar, inventoryExpert, ledgerExpert, controlPlaneExpert, apExpert]) {
    assert.deepEqual(validateManifest(expert), []);
    const ids = new Set(expert.policies.map(policy => policy.id));
    for (const id of requiredPolicies) assert.ok(ids.has(id), `${expert.id} missing ${id}`);
  }
});


test('cost-center capability manifest validates as cross-domain route seed', async () => {
  const costCenter = JSON.parse(await readFile(new URL('../examples/cost-center.manifest.json', import.meta.url), 'utf8'));
  assert.deepEqual(validate(costCenter), []);
  assert.equal(costCenter.capability.id, 'cost-center');
  assert.ok(costCenter.services.includes('ledger-service'));
  assert.ok(costCenter.services.includes('admin-service'));
  assert.ok(costCenter.services.includes('inventory-service'));
  assert.ok(costCenter.governance.architectHandoff.some(item => item.includes('segmented')));
  assert.ok(costCenter.restrictions.some(item => item.includes('opaque flat AccountCode')));
});


test('document reception routes to AP and blocks auto-posting', async () => {
  const apCapability = JSON.parse(await readFile(new URL('../examples/ap.manifest.json', import.meta.url), 'utf8'));
  const receptionCapability = JSON.parse(await readFile(new URL('../examples/document-reception.manifest.json', import.meta.url), 'utf8'));
  assert.deepEqual(validate(apCapability), []);
  assert.deepEqual(validate(receptionCapability), []);
  assert.deepEqual(validateManifest(apExpert), []);
  const experts = [ar, inventoryExpert, ledgerExpert, controlPlaneExpert, apExpert];
  const intakeIntent = {
    domain: 'ap',
    capability: 'document-reception',
    action: 'inspect-inbound-vendor-invoice',
    impactedDomains: ['ap', 'ledger', 'inventory', 'control-plane'],
    risks: ['document-management'],
    approvedActions: [],
    experts
  };
  const routed = transition('ready', facts, intakeIntent);
  assert.equal(routed.state, 'escalate');
  assert.equal(routed.primaryExpert, 'ap-expert');
  assert.deepEqual(routed.expertDecision.targets, ['architect', 'reviewer']);

  const blocked = transition('ready', facts, { ...intakeIntent, action: 'post-ap-liability-from-email' });
  assert.equal(blocked.state, 'block');
  assert.equal(blocked.reason, 'expert-restriction');
});


test('valid escalation requires recommendation policy while hard blocks stay blocks', () => {
  const experts = [ar, inventoryExpert, ledgerExpert, controlPlaneExpert, apExpert];
  const costCenterIntent = {
    domain: 'ledger',
    capability: 'ledger',
    action: 'inspect-cost-center-dimension',
    impactedDomains: ['ledger', 'inventory', 'control-plane'],
    risks: ['cost-center-policy'],
    approvedActions: [],
    experts
  };
  const escalated = transition('ready', facts, costCenterIntent);
  assert.equal(escalated.state, 'escalate');
  assert.equal(escalated.primaryExpert, 'ledger-expert');
  assert.ok(ledgerExpert.policies.some(policy => policy.id === 'escalation-recommendations'));

  const hardBlock = transition('ready', facts, { ...costCenterIntent, action: 'bypass-period-lock' });
  assert.equal(hardBlock.state, 'block');
  assert.equal(hardBlock.reason, 'expert-restriction');
});


test('cross-domain escalation carries deliberation policy for impacted experts', () => {
  const experts = [ar, inventoryExpert, ledgerExpert, controlPlaneExpert, apExpert];
  const intent = {
    domain: 'ledger',
    capability: 'cost-center',
    action: 'inspect-cost-center-dimension',
    impactedDomains: ['ledger', 'inventory', 'control-plane'],
    risks: ['cost-center-policy'],
    approvedActions: [],
    experts
  };
  const result = transition('ready', facts, intent);
  assert.equal(result.state, 'escalate');
  assert.equal(result.primaryExpert, 'ledger-expert');
  for (const expert of [ledgerExpert, inventoryExpert, controlPlaneExpert]) {
    assert.ok(expert.policies.some(policy => policy.id === 'domain-deliberation'), `${expert.id} missing deliberation policy`);
  }
});


test('document workflow policy is mandatory for AP handoff', async () => {
  const receptionCapability = JSON.parse(await readFile(new URL('../examples/document-reception.manifest.json', import.meta.url), 'utf8'));
  assert.deepEqual(validate(receptionCapability), []);
  for (const expert of [apExpert, ledgerExpert, controlPlaneExpert]) {
    assert.ok(expert.policies.some(policy => policy.id === 'document-workflow-deliberation'), `${expert.id} missing document workflow policy`);
  }
  assert.ok(receptionCapability.retrieval.seedNodes.includes('protocol/document-workflow-deliberation.md'));
  assert.ok(receptionCapability.restrictions.some(item => item.includes('payment authorization and accounting approval')));
});


test('accounting segmentation capability formalizes DisplayCode as derived and routes cross-domain', async () => {
  const segmentation = JSON.parse(await readFile(new URL('../examples/accounting-segmentation.manifest.json', import.meta.url), 'utf8'));
  assert.deepEqual(validate(segmentation), []);
  assert.equal(segmentation.capability.id, 'accounting-segmentation');
  assert.ok(segmentation.restrictions.some(item => item.includes('DisplayCode')));
  assert.ok(segmentation.retrieval.seedNodes.includes('policies/architecture/accounting-segmentation-engine.md'));
  for (const expert of [ledgerExpert, controlPlaneExpert, inventoryExpert]) {
    assert.equal(expert.version, 11);
    assert.ok(expert.coveredCapabilities.includes('accounting-segmentation'), expert.id);
    assert.ok(expert.policies.some(policy => policy.id === 'accounting-segmentation-engine'), expert.id);
    assert.ok(expert.policies.some(policy => policy.id === 'agnostic-engine-sovereignty'), expert.id);
  }
  const result = transition('ready', facts, {
    domain: 'ledger',
    capability: 'accounting-segmentation',
    action: 'inspect-segmented-account-code',
    impactedDomains: ['ledger', 'control-plane', 'inventory'],
    risks: ['accounting-segmentation'],
    approvedActions: [],
    experts: [ar, inventoryExpert, ledgerExpert, controlPlaneExpert, apExpert]
  });
  assert.equal(result.state, 'escalate');
  assert.equal(result.primaryExpert, 'ledger-expert');
  assert.deepEqual(result.expertDecision.targets, ['architect', 'control-plane-expert', 'po', 'reviewer']);
});

test('v11 experts publish product direction, official market lessons and executable gates', () => {
  for (const expert of [ar, inventoryExpert, ledgerExpert, controlPlaneExpert, apExpert, taxExpert]) {
    assert.deepEqual(validateManifest(expert), []);
    assert.ok(expert.northStar.bestVersion.length > 20, expert.id);
    assert.ok(expert.northStar.businessOutcomes.length > 0, expert.id);
    assert.ok(expert.northStar.invariants.length > 0, expert.id);
    assert.match(expert.marketIntelligence.verifiedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(expert.marketIntelligence.lessons.every(lesson => lesson.reference.startsWith('https://')), expert.id);
    assert.ok(expert.enforcement.gates.some(gate => gate.id === 'authority-readiness'), expert.id);
    assert.ok(expert.enforcement.readyWhen.length > 20, expert.id);
    for (const key of ['northStar', 'marketIntelligence', 'enforcement']) {
      const bad = structuredClone(expert);
      delete bad[key];
      assert.ok(validateManifest(bad).length, `${expert.id} accepted without ${key}`);
    }
  }
});

test('Tax routes fiscal calculation and escalates accounting and country policy impact', async () => {
  const taxCapability = JSON.parse(await readFile(new URL('../examples/tax.manifest.json', import.meta.url), 'utf8'));
  assert.deepEqual(validate(taxCapability), []);
  assert.deepEqual(validateManifest(taxExpert), []);
  const result = transition('ready', facts, {
    domain: 'tax',
    capability: 'tax',
    action: 'change-tax-treatment',
    impactedDomains: ['tax', 'ledger', 'control-plane'],
    risks: ['accounting-impact', 'country-policy'],
    approvedActions: [],
    experts: [taxExpert, ledgerExpert, controlPlaneExpert]
  });
  assert.equal(result.state, 'block');
  assert.equal(result.primaryExpert, 'tax-expert');
  assert.equal(result.reason, 'expert-approval-missing');
});

const ledgerCapability = JSON.parse(await readFile(new URL('../examples/ledger.manifest.json', import.meta.url), 'utf8'));

function activeEntry(manifest, overrides = {}) {
  const graphRevision = 'ubp-test-revision';
  return {
    expertId: manifest.id,
    status: 'active',
    accountableOwner: `${manifest.id}-owner`,
    backupOwner: `${manifest.id}-backup`,
    approvedBy: 'santiago',
    approvedRevision: 'governance-test-revision',
    manifestSha256: sha256(manifest),
    reviewDueAt: '2026-12-31T23:59:59Z',
    seedGraphRevision: graphRevision,
    seedVerificationSha256: seedVerificationSha256(graphRevision, manifest.seedNodes),
    blockedActions: [],
    ...overrides
  };
}

function readinessInput(overrides = {}) {
  return {
    registry: {
      kind: 'domain-expert-registry',
      version: 1,
      ubpRevision: 'ubp-test-revision',
      graphSourceRevision: 'ubp-test-revision',
      entries: [activeEntry(ledgerExpert)]
    },
    expertManifests: [ledgerExpert],
    capabilityManifests: [ledgerCapability],
    request: {
      domain: 'ledger',
      capability: 'ledger',
      action: 'inspect-journal-entry',
      impactedDomains: ['ledger']
    },
    evaluatedAt: '2026-09-09T12:00:00Z',
    ...overrides
  };
}

test('governance readiness advances only with complete current evidence', () => {
  const result = evaluateGovernanceReadiness(readinessInput());
  assert.equal(result.decision, 'READY');
  assert.equal(result.primaryExpert, 'ledger-expert');
  assert.equal(result.ubpRevision, 'ubp-test-revision');
});

test('governance readiness blocks inactive, stale, altered or incomplete authority', () => {
  const cases = [
    input => { input.registry.entries[0].status = 'candidate'; },
    input => { delete input.registry.entries[0].accountableOwner; },
    input => { input.registry.entries[0].backupOwner = input.registry.entries[0].accountableOwner; },
    input => { input.registry.entries[0].manifestSha256 = '0'.repeat(64); },
    input => { input.registry.graphSourceRevision = 'old-ubp-revision'; },
    input => { input.registry.entries[0].seedGraphRevision = 'old-ubp-revision'; },
    input => { input.registry.entries[0].seedVerificationSha256 = '0'.repeat(64); },
    input => { input.registry.entries[0].reviewDueAt = '2026-09-08T23:59:59Z'; },
    input => { input.registry.entries[0].blockedActions = ['inspect-journal-entry']; }
  ];
  for (const mutate of cases) {
    const input = readinessInput();
    mutate(input);
    assert.equal(evaluateGovernanceReadiness(input).decision, 'BLOCK');
  }
});

test('governance readiness blocks stale or future market intelligence', () => {
  const stale = readinessInput({ evaluatedAt: '2027-09-09T12:00:00Z' });
  stale.registry.entries[0].reviewDueAt = '2028-12-31T23:59:59Z';
  assert.ok(evaluateGovernanceReadiness(stale).reasons.some(reason => reason.endsWith('market-intelligence-stale')));

  const future = readinessInput({ evaluatedAt: '2026-09-08T12:00:00Z' });
  assert.ok(evaluateGovernanceReadiness(future).reasons.some(reason => reason.endsWith('market-review-from-future')));
});

test('governance readiness blocks missing catalogs and uncovered impacted domains', () => {
  assert.deepEqual(evaluateGovernanceReadiness(readinessInput({ capabilityManifests: [] })).reasons, ['missing-capability']);
  assert.deepEqual(evaluateGovernanceReadiness(readinessInput({ expertManifests: [] })).reasons, ['missing-primary-expert']);

  const crossDomain = readinessInput();
  crossDomain.request.impactedDomains.push('inventory');
  assert.deepEqual(evaluateGovernanceReadiness(crossDomain).reasons, ['inventory:missing-impacted-expert']);

  crossDomain.expertManifests.push(inventoryExpert);
  crossDomain.registry.entries.push(activeEntry(inventoryExpert));
  assert.equal(evaluateGovernanceReadiness(crossDomain).decision, 'READY');

  crossDomain.registry.entries[1].status = 'suspended';
  const suspended = evaluateGovernanceReadiness(crossDomain);
  assert.equal(suspended.decision, 'BLOCK');
  assert.ok(suspended.reasons.includes('impacted:inventory-expert:expert-not-active'));
});

test('governance readiness rejects invalid registry state and ambiguous authority', () => {
  const invalidStatus = readinessInput();
  invalidStatus.registry.entries[0].status = 'invented';
  assert.equal(evaluateGovernanceReadiness(invalidStatus).decision, 'BLOCK');

  const ambiguous = readinessInput();
  ambiguous.expertManifests.push({ ...ledgerExpert, id: 'ledger-other-expert' });
  assert.deepEqual(evaluateGovernanceReadiness(ambiguous).reasons, ['ambiguous-primary-expert']);
});

test('UBP registry promotes Control Plane, Ledger and Tax after complete evidence', async () => {
  const registryPath = fileURLToPath(new URL('../inventory/ubp-domain-expert-registry.json', import.meta.url));
  const registry = JSON.parse(await readFile(registryPath, 'utf8'));
  assert.deepEqual(validateRegistry(registry), []);
  assert.equal(registry.entries.length, 30);
  assert.equal(new Set(registry.entries.map(entry => entry.expertId)).size, 30);
  const active = registry.entries.filter(entry => entry.status === 'active').map(entry => entry.expertId).sort();
  assert.deepEqual(active, ['control-plane-expert', 'ledger-expert', 'tax-expert']);
  assert.ok(registry.entries.filter(entry => !active.includes(entry.expertId)).every(entry => entry.status === 'candidate'));
  const cli = fileURLToPath(new URL('../tools/validate-capability-manifests.mjs', import.meta.url));
  assert.equal(spawnSync(process.execPath, [cli, registryPath]).status, 0);
});

test('seed audit resolves only deterministic graph anchors', () => {
  const nodes = [
    { id: 'ubp_ledger_domain_journalentry_journalentry', label: 'JournalEntry', source_file: 'src/JournalEntry.cs' },
    { id: 'adr_adr_0011_contabilidad_gl', label: 'ADR-0011-contabilidad-gl.md', source_file: 'docs/adr/ADR-0011-contabilidad-gl.md' },
    { id: 'captura_factura_ocr_manifest', label: 'manifest.json', source_file: 'capa/ADR-0023-compras-cxp/captura-factura-ocr/manifest.json' },
    { id: 'one', label: 'Repeated', source_file: 'one.cs' },
    { id: 'two', label: 'Repeated', source_file: 'two.cs' },
    { id: 'policy-current', label: 'policy', source_file: 'policies/example.md' },
    { id: 'policy-mirror', label: 'policy', source_file: 'snapshot/policies/example.md' }
  ];
  assert.equal(resolveSeed('ubp_ledger_domain_journalentry_journalentry', nodes).status, 'resolved');
  assert.equal(resolveSeed('ADR-0011 Contabilidad GL', nodes).status, 'resolved');
  assert.equal(resolveSeed('CAPA ADR-0023 captura-factura-ocr', nodes).status, 'resolved');
  assert.equal(resolveSeed('Repeated', nodes).status, 'ambiguous');
  assert.deepEqual(resolveSeed('policies/example.md', nodes), {
    seed: 'policies/example.md',
    status: 'resolved',
    method: 'exact-source',
    matches: [{ id: 'policy-current', sourceFile: 'policies/example.md' }],
    matchCount: 1
  });
  assert.equal(resolveSeed('Absent', nodes).status, 'missing');
});

test('seed audit emits an attestation only when every seed resolves', () => {
  const nodes = ar.seedNodes.map(seed => ({ id: seed, label: seed, source_file: `${seed}.txt` }));
  const ready = auditExpertSeeds({ nodes }, [ar], 'ubp-test-revision');
  assert.equal(ready.experts[0].decision, 'READY');
  assert.match(ready.experts[0].seedVerificationSha256, /^[a-f0-9]{64}$/);

  const blocked = auditExpertSeeds({ nodes: nodes.slice(1) }, [ar], 'ubp-test-revision');
  assert.equal(blocked.experts[0].decision, 'BLOCK');
  assert.equal(blocked.experts[0].seedVerificationSha256, null);
});

test('seed audit CLI accepts documented stdout mode without an output option', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'capa-seed-audit-'));
  try {
    const graphPath = join(dir, 'graph.json');
    const manifestPath = join(dir, 'expert.json');
    const graph = { nodes: ar.seedNodes.map(seed => ({ id: seed, label: seed, source_file: `${seed}.txt` })) };
    await Promise.all([
      writeFile(graphPath, JSON.stringify(graph)),
      writeFile(manifestPath, JSON.stringify(ar))
    ]);
    const cli = fileURLToPath(new URL('../tools/audit-expert-seeds.mjs', import.meta.url));
    const result = spawnSync(process.execPath, [cli, graphPath, manifestPath, '--graph-revision', 'ubp-test-revision'], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).experts[0].decision, 'READY');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('committed UBP seed audit remains tied to current manifests and registry revision', async () => {
  const report = JSON.parse(await readFile(new URL('../inventory/ubp-existing-expert-seed-audit.json', import.meta.url), 'utf8'));
  const registry = JSON.parse(await readFile(new URL('../inventory/ubp-domain-expert-registry.json', import.meta.url), 'utf8'));
  const manifests = [apExpert, ar, controlPlaneExpert, inventoryExpert, ledgerExpert, taxExpert];
  const verifiedSeeds = new Set(['ap-expert', 'control-plane-expert', 'ledger-expert', 'tax-expert']);
  assert.equal(report.graphRevision, registry.ubpRevision);
  assert.equal(report.experts.length, manifests.length);
  for (const manifest of manifests) {
    const audited = report.experts.find(expert => expert.expertId === manifest.id);
    assert.equal(audited.manifestSha256, sha256(manifest), manifest.id);
    if (verifiedSeeds.has(manifest.id)) {
      assert.equal(audited.decision, 'READY');
      assert.match(audited.seedVerificationSha256, /^[a-f0-9]{64}$/);
    } else {
      assert.equal(audited.decision, 'BLOCK');
      assert.equal(audited.seedVerificationSha256, null);
    }
  }
});

test('PO governance publishes coherent Control Plane, Ledger and Tax authorities', async () => {
  const input = await loadPoCatalog('2026-09-10T12:00:00Z');
  const result = evaluatePoGovernance(input);
  assert.equal(result.decision, 'CONTROLLED');
  assert.deepEqual(result.summary, { ready: 3, blocked: 27, total: 30 });
  assert.equal(result.experts.find(item => item.expertId === 'control-plane-expert').decision, 'READY');
  assert.equal(result.experts.find(item => item.expertId === 'ledger-expert').decision, 'READY');
  const tax = result.experts.find(item => item.expertId === 'tax-expert');
  assert.equal(tax.decision, 'READY');
  assert.equal(tax.sovereignty, 'READY');
});

test('PO governance blocks authority drift and sovereignty from another UBP revision', async () => {
  const inactive = await loadPoCatalog('2026-09-10T12:00:00Z');
  inactive.registry.entries.find(item => item.expertId === 'tax-expert').status = 'candidate';
  const missingAuthority = evaluatePoGovernance(inactive);
  assert.equal(missingAuthority.decision, 'BLOCK');
  assert.ok(missingAuthority.reasons.includes('tax-expert:required-expert-not-ready'));

  const stale = await loadPoCatalog('2026-09-10T12:00:00Z');
  stale.sovereigntyEvidence['tax-expert'].ubpRevision = 'another-ubp-revision';
  const drift = evaluatePoGovernance(stale);
  assert.equal(drift.decision, 'BLOCK');
  assert.ok(drift.experts.find(item => item.expertId === 'tax-expert').reasons.includes('sovereignty-revision-drift'));

  const duplicate = await loadPoCatalog('2026-09-10T12:00:00Z');
  duplicate.expertManifests.push(structuredClone(duplicate.expertManifests[0]));
  assert.ok(evaluatePoGovernance(duplicate).reasons.includes('duplicate-expert-id'));
});

test('PO decision returns product foundations with GO for a governed Tax action', async () => {
  const input = JSON.parse(await readFile(new URL('../examples/tax.po-request.json', import.meta.url), 'utf8'));
  const catalog = await loadPoCatalog(input.evaluatedAt);
  const result = evaluateProductDecision(input, catalog);
  assert.equal(result.decision, 'GO');
  assert.equal(result.primaryExpert, 'tax-expert');
  assert.ok(result.productBasis.bestVersion.length > 20);
  assert.ok(result.productBasis.invariants.length > 0);
  assert.ok(result.productBasis.requiredGates.includes('engine-sovereignty-e2e'));
});

test('PO decision governs Control Plane and Ledger while sovereignty claims remain blocked', async () => {
  const base = JSON.parse(await readFile(new URL('../examples/tax.po-request.json', import.meta.url), 'utf8'));
  const catalog = await loadPoCatalog(base.evaluatedAt);
  for (const domain of ['control-plane', 'ledger']) {
    const governed = structuredClone(base);
    governed.request = { ...governed.request, domain, capability: domain, action: 'govern-product-change', impactedDomains: [domain] };
    assert.equal(evaluateProductDecision(governed, catalog).decision, 'GO');

    const sovereignty = structuredClone(governed);
    sovereignty.request.action = domain === 'control-plane' ? 'declare-control-plane-sovereign' : 'declare-ledger-country-sovereign';
    const blocked = evaluateProductDecision(sovereignty, catalog);
    assert.equal(blocked.decision, 'BLOCK');
    assert.equal(blocked.stage, 'authority-readiness');
  }
});

test('PO decision blocks prohibited actions, escalates governed crossings and blocks missing authorities', async () => {
  const base = JSON.parse(await readFile(new URL('../examples/tax.po-request.json', import.meta.url), 'utf8'));
  const catalog = await loadPoCatalog(base.evaluatedAt);

  const prohibited = structuredClone(base);
  prohibited.request.action = 'hardcode-country-in-tax-core';
  const hardBlock = evaluateProductDecision(prohibited, catalog);
  assert.equal(hardBlock.decision, 'BLOCK');
  assert.deepEqual(hardBlock.reasons, ['expert-restriction']);

  const crossDomain = structuredClone(base);
  crossDomain.request.impactedDomains = ['tax', 'ledger'];
  const governedHandoff = evaluateProductDecision(crossDomain, catalog);
  assert.equal(governedHandoff.decision, 'ESCALATE');
  assert.equal(governedHandoff.stage, 'product-deliberation');

  const missingDomain = structuredClone(base);
  missingDomain.request.impactedDomains = ['tax', 'inventory'];
  const authorityBlock = evaluateProductDecision(missingDomain, catalog);
  assert.equal(authorityBlock.decision, 'BLOCK');
  assert.equal(authorityBlock.stage, 'authority-readiness');
  assert.ok(authorityBlock.reasons.includes('impacted:inventory-expert:expert-not-active'));
});

test('Claude execution requires the full governed sequence before completion', async () => {
  const [attestation, policy] = await Promise.all([
    readFile(new URL('../examples/claude-execution.attestation.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../inventory/claude-execution-policy.json', import.meta.url), 'utf8').then(JSON.parse)
  ]);
  const result = evaluateClaudeExecution(attestation, policy);
  assert.equal(result.decision, 'COMPLETE');
  assert.equal(result.goalId, 'example-governed-goal');

  const start = structuredClone(attestation);
  start.phase = 'start';
  start.goal.status = 'active';
  start.agents.status = 'dispatched';
  assert.equal(evaluateClaudeExecution(start, policy).decision, 'READY_TO_START');
});

test('Claude execution blocks missing skills, stale Graphify and review findings', async () => {
  const [source, policy] = await Promise.all([
    readFile(new URL('../examples/claude-execution.attestation.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../inventory/claude-execution-policy.json', import.meta.url), 'utf8').then(JSON.parse)
  ]);
  const cases = [
    [input => { input.objective.status = 'unclear'; }, 'objective-not-clear'],
    [input => { input.plan.invoked = false; }, 'plan-not-complete'],
    [input => { input.goal.receipt = ''; }, 'goal-not-active'],
    [input => { input.agents.assignments = []; }, 'agents-not-dispatched'],
    [input => { input.review.reviewerId = input.agents.workerIds[0]; }, 'peer-review-not-passed'],
    [input => { input.graphify.before.indexSha256 = 'stale'; }, 'graphify-before-missing'],
    [input => { input.graphify.after.anchors = []; }, 'graphify-after-missing'],
    [input => { input.review.unresolvedFindings = 1; }, 'peer-review-not-passed'],
    [input => { input.goal.completedAt = '2026-09-10T12:05:00Z'; }, 'completion-sequence-invalid']
  ];
  for (const [mutate, reason] of cases) {
    const input = structuredClone(source);
    mutate(input);
    const result = evaluateClaudeExecution(input, policy);
    assert.equal(result.decision, 'BLOCK');
    assert.ok(result.reasons.includes(reason), reason);
  }
});

test('Claude execution permits the declared planning fallback only with a clear objective', async () => {
  const [input, policy] = await Promise.all([
    readFile(new URL('../examples/claude-execution.attestation.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../inventory/claude-execution-policy.json', import.meta.url), 'utf8').then(JSON.parse)
  ]);
  input.plan.method = policy.planFallback;
  input.plan.invoked = false;
  input.plan.fallbackReason = '/ultraplan was unavailable; objective and acceptance criteria were clarified before work.';
  assert.equal(evaluateClaudeExecution(input, policy).decision, 'COMPLETE');
  input.objective.status = 'unclear';
  assert.equal(evaluateClaudeExecution(input, policy).decision, 'BLOCK');

  const weakened = structuredClone(policy);
  weakened.skills.review = '/review';
  assert.deepEqual(evaluateClaudeExecution(input, weakened).reasons, ['invalid-claude-execution-policy']);
});

function sovereigntyInput() {
  const ubpRevision = 'ubp-test-revision';
  const proof = id => ({
    reference: `${id}:anchor`,
    command: `${id}:test`,
    result: 'passed',
    exitCode: 0,
    resultSha256: 'a'.repeat(64),
    executedAt: '2026-09-09T11:00:00Z',
    ubpRevision
  });
  return {
    kind: 'engine-sovereignty-evidence',
    version: 1,
    engine: 'tax',
    ubpRevision,
    evaluatedAt: '2026-09-09T12:00:00Z',
    stages: requiredStages.map(id => ({
      id,
      status: 'PASS',
      evidence: [proof(id)]
    })),
    countryArtifacts: [
      { reference: 'TaxPolicyResource', classification: 'country-pack-data', justification: 'Versioned fiscal policy.' },
      { reference: 'ExternalFiscalRenderer', classification: 'legal-adapter', justification: 'Universal adapter boundary.' },
      { reference: 'CompoundTaxPrimitive', classification: 'universal-primitive', justification: 'Country-neutral engine capability.' }
    ]
  };
}

test('engine sovereignty requires every executable stage on one UBP revision', () => {
  const ready = evaluateEngineSovereignty(sovereigntyInput());
  assert.equal(ready.decision, 'READY');
  assert.equal(Object.keys(ready.stages).length, requiredStages.length);

  for (const id of requiredStages) {
    const missing = sovereigntyInput();
    missing.stages = missing.stages.filter(stage => stage.id !== id);
    assert.ok(evaluateEngineSovereignty(missing).reasons.includes(`${id}:missing-stage`), id);

    const blocked = sovereigntyInput();
    blocked.stages.find(stage => stage.id === id).status = 'BLOCK';
    assert.ok(evaluateEngineSovereignty(blocked).reasons.includes(`${id}:not-demonstrated`), id);
  }
});

test('documents without executable evidence and stale anchors never prove sovereignty', () => {
  const empty = sovereigntyInput();
  empty.stages[0].evidence = [];
  assert.equal(evaluateEngineSovereignty(empty).decision, 'BLOCK');
  assert.ok(evaluateEngineSovereignty(empty).reasons.includes('control-plane-publication:missing-or-stale-executable-evidence'));

  const stale = sovereigntyInput();
  stale.stages[0].evidence[0].ubpRevision = 'old-revision';
  assert.ok(evaluateEngineSovereignty(stale).reasons.includes('control-plane-publication:missing-or-stale-executable-evidence'));

  const failed = sovereigntyInput();
  failed.stages[0].evidence[0].exitCode = 1;
  assert.ok(evaluateEngineSovereignty(failed).reasons.includes('control-plane-publication:missing-or-stale-executable-evidence'));

  const unsigned = sovereigntyInput();
  delete unsigned.stages[0].evidence[0].resultSha256;
  assert.ok(evaluateEngineSovereignty(unsigned).reasons.includes('control-plane-publication:missing-or-stale-executable-evidence'));
});

test('every country artifact must have a governed architectural classification', () => {
  for (const mutate of [
    item => { delete item.classification; },
    item => { item.classification = 'country-switch'; },
    item => { item.justification = ''; }
  ]) {
    const input = sovereigntyInput();
    mutate(input.countryArtifacts[0]);
    assert.ok(evaluateEngineSovereignty(input).reasons.includes('unclassified-country-artifact'));
  }
});

test('committed Tax sovereignty evidence reports the audited UBP state as READY', async () => {
  const evidence = JSON.parse(await readFile(new URL('../inventory/tax-sovereignty-evidence.json', import.meta.url), 'utf8'));
  const result = evaluateEngineSovereignty(evidence);
  assert.equal(result.decision, 'READY');
  assert.deepEqual(result.reasons, ['engine-sovereignty-demonstrated']);
  assert.equal(result.stages['engine-consumption'], 'PASS');
  assert.equal(result.stages['fictitious-country'], 'PASS');
  assert.equal(result.stages['accounting-handoff'], 'PASS');
});
