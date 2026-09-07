# Domain Deliberation v8

Domain deliberation turns a valid `escalate` into a governed expert conversation. It is not a majority vote and not a free-form debate.

## Trigger

Open deliberation when the broker returns `escalate` for a published capability because of cross-domain impact, unresolved product/architecture decision, conflicting ADR/CAPA interpretation, retrieval exhaustion with enough directional evidence, or an expert risk.

Do not open deliberation to bypass a hard block. Invalid facts, unpublished capability, invalid manifest, absolute restrictions, missing action-scoped approval, tenant isolation breach, direct privileged role mutation, BFF bypass or posted-history mutation remain `block`.

## Participants

Include only impacted experts:

- Primary domain expert owns the original intent.
- Impacted domain experts answer only inside their authority.
- Architect consolidates cross-domain design.
- Reviewer validates route, policies, gates and evidence.
- PO signs product, scope, migration, commercial or policy decisions.
- Compliance participates only for fiscal, legal, privacy or regulatory impact.

## Expert statement

Each expert produces a bounded statement:

1. Domain position.
2. Evidence used.
3. Accepted assumptions.
4. Risks in its authority.
5. Required conditions to proceed.
6. Hard blockers, if any.
7. Tests or gates required.

## Resolution states

- `accepted`: all impacted domains accept and no extra signature is needed before the next safe step.
- `accepted-with-conditions`: domains accept, but gates, evidence, CAPA text or non-destructive prerequisites must be completed before implementation.
- `needs-po-signature`: technical consensus exists, but product, policy, scope, migration or commercial decision must be signed.
- `blocked`: a hard restriction, broken invariant, tenant/security issue, ungoverned historical mutation, invalid route or critical evidence gap prevents proceeding.

## Decision rule

Agreement can advance the work. A hard restriction with evidence stops it. Majority cannot overrule a domain owner on facts inside that domain.

## Recommendation package

The Architect consolidates:

1. Chosen recommendation.
2. Domain statements summary.
3. Conditions to proceed.
4. Decisions requiring PO signature.
5. Rejected alternatives and why.
6. Migration/backfill impact.
7. Tests and gates.
8. Resulting broker state.

The Reviewer then validates route conformance before implementation.

## Cost-center discrepancy example

For segmented accounts and cost centers:

- Ledger decides if a segment affects posting, balance, account map, period, reversal or reporting.
- Control Plane decides if segment order, masks, requirements, defaults and tenant policy are configurable.
- Inventory decides what operational facts can be derived from item, warehouse, branch, movement, stock, kardex and valuation.
- Architect decides the cross-domain model.
- Reviewer ensures no flat opaque account, no hardcoded customer/country, no BFF bypass and no historical mutation without CAPA.
- PO signs whether branch defaults cost center, whether warehouse becomes segment/dimension, whether party is segment or subledger reference, whether DisplayCode is derived/persisted and whether document splitting/backfill are required.

If all agree on typed segments and derived DisplayCode, the result is `needs-po-signature` or `accepted-with-conditions`, not `block`, unless implementation attempts to mutate history or violate an absolute policy.
