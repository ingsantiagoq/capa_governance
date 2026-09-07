# Escalation Recommendations v7

Escalation is not a dead end. When the broker returns `escalate` for a valid published capability, the primary expert must produce a bounded recommendation package unless the action is blocked by an absolute restriction, invalid facts, invalid catalog or missing capability.

## Rule

If the state is `escalate` and the reason is one of:

- `decision-required`
- `expert-risk-or-cross-domain`
- `retrieval-exhausted`
- `handoff-required`
- `missing-expert`
- `ambiguous-expert`

then the consumer must ask the selected expert, or the fallback governance role, for an escalation recommendation.

The recommendation is not approval and does not authorize implementation. It gives the PO, Architect, Reviewer or Compliance target a concrete decision to accept, reject or modify.

## Required package

Every escalation recommendation includes:

1. Conflict or open decision.
2. Recommended path.
3. Alternatives rejected.
4. Required signature or owner.
5. Impacted domains.
6. Evidence already available.
7. Evidence still missing.
8. Prohibited actions while unresolved.
9. Tests or gates required before implementation.
10. Broker state and reason.

## Block remains hard

No recommendation may soften a block caused by:

- invalid facts;
- invalid manifest or unpublished capability;
- absolute restriction;
- missing action-scoped approval for a protected action;
- tenant isolation breach;
- privileged role mutation;
- bypassing BFF;
- mutating posted accounting history.

In those cases the package can explain the block, but cannot propose execution.

## Cost-center example

For segmented accounts and cost centers, a valid escalation recommendation is:

- UBP should support segmented account representation as typed dimensions plus derived display code.
- `NaturalAccount` remains the account base.
- `BranchId` is already signed as a typed dimension and may be exported as a required external segment.
- `WarehouseId`, `PartyId` and `CostCenterId` require explicit CAPA/PO decision before persistence or backfill.
- Control Plane governs masks, segment order, requirements, defaults and tenant policy.
- Ledger governs posting, balance, account map, period, reversal and reporting.
- Inventory contributes operational origin: item, warehouse, branch, movement, stock, kardex and valuation.
- Document splitting is required only if UBP must produce balanced statements by segment.
- Implementation remains blocked until signatures, migration plan and tests are complete.
