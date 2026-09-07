# Accounting Segmentation Engine Policy

UBP supports a configurable segmented chart of accounts model. A rendered account string such as `613505-10-001-------1020421343` is a DisplayCode for reporting and interoperability, not the primary accounting truth.

## Mandatory model

- Ledger owns posting, journal lines, balances, reversals, period locks and dimensional reporting.
- Control Plane owns segment masks, order, width, labels, source binding, requiredness, defaults and effective dates.
- Operational domains such as Inventory, AP, AR and POS only supply typed business facts such as branch, warehouse, party, item, document or movement. They do not concatenate accounting strings and do not post Ledger directly.
- The natural account remains separate from typed segments. Examples of segment types are branch, warehouse, cost center, project, party, subledger reference, reserved and future extension.
- DisplayCode is derived from the natural account plus typed segments using the active mask for the relevant tenant, ledger, date and policy scope.

## Required evidence before implementation

Any CAPA or implementation that touches segmented accounts must declare:

1. Natural account source.
2. Segment list, type and semantic owner.
3. Segment source domain and derivation rule.
4. Required, optional, defaulted or reserved status.
5. Effective date and history behavior.
6. Balance/reporting implication, including whether document splitting is required.
7. Migration and backfill boundary.
8. Interoperability format and parse/render responsibility.

## Hard restrictions

- Do not persist the full DisplayCode as the only accounting identity.
- Do not hardcode tenant, customer, country, branch, warehouse, party, account, mask or segment order.
- Do not let UI or BFF assemble masks as business truth; they may render values returned by governed APIs.
- Do not reinterpret posted history by changing a mask retroactively. Masks must be effective-dated, or historical DisplayCodes must remain reproducible.
- Do not decide that branch equals cost center, or warehouse determines account, without an explicit Control Plane and Ledger decision.
- Do not bypass period close, reversal policy, tenant isolation or BFF boundaries.

## Broker behavior

Intentions involving segmented account codes, branch/cost center defaults, warehouse accounting separation, party as a segment, document splitting, account determination, account maps, or DisplayCode parsing must route through the published accounting-segmentation capability.

The primary expert is Ledger. Control Plane, Inventory and any source domain such as AP or AR participate when their facts feed a segment. Architect and Reviewer are mandatory for cross-domain semantics, persistence, migration, document splitting or interoperability format changes. PO signature is required for business semantics, customer-visible format, migration scope and policy defaults.
