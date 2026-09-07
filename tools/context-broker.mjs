// Pure protocol reference. Evidence is supplied by the consumer, never inferred
// here from prose. Missing facts fail closed; ready does not execute operations.
export function transition(previous, facts) {
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
