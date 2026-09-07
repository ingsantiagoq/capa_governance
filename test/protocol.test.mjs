import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validate, assertSupported } from '../tools/validate-capability-manifests.mjs';
import { transition } from '../tools/context-broker.mjs';

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
  const requiredPolicies = new Set(['context-order', 'route-conformance', 'design-patterns', 'configuration-governance', 'tenant-boundaries', 'testing-gates', 'approval-boundaries']);
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
