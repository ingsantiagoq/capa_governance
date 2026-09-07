# Ledger Market Lens for UBP

Date: 2026-09-07
Status: curated comparison seed for `ledger-expert`; not a runtime catalog.

This lens keeps market knowledge separate from UBP truth. UBP facts come from ADR-0011, ADR-0009, ADR-0008, ADR-0043, CAPA manifests, Graphify and source code. Market references shape accounting semantics, gaps and design pressure.

## Comparison matrix

| Axis | UBP context | SAP pressure | Dynamics pressure | Oracle pressure | Odoo pressure | UBP direction |
|---|---|---|---|---|---|---|
| Posted accounting fact | Journal entries are immutable; correction must be reversal or governed adjustment. | FI documents and reversals protect auditability. | Posted journals and financial dimensions drive reporting. | Subledger accounting feeds controlled GL journals. | Accounting moves keep posted state and reconciliation semantics. | Never mutate posted history; use reversal and audit gates. |
| Cost center / analytic dimension | Cost center is separate from account and branch; belongs to Ledger semantics when it affects entries/reports. | Cost center/profit center and document splitting enable segment reporting. | Financial dimensions attach business context to entries. | COA segments/flexfields and SLA rules carry accounting dimensions. | Analytic accounts/plans split costs by dimension. | Model dimensions explicitly; do not encode them in account numbers. |
| Account determination | Account maps and posting behaviors choose accounting roles. | Account determination/configuration avoids hardcoded accounts. | Posting profiles configure ledger effects. | SLA/accounting rules resolve entries from subledgers. | Product/account configuration drives moves. | Keep account mapping configurable and reviewed through Control Plane. |
| Period control | Period close and reversal rules are hard boundaries. | Closed periods require controlled reopening or adjustment. | Fiscal calendars and period controls guard posting. | Accounting periods and approvals guard journals. | Lock dates and posted moves restrict mutation. | Block closed-period writes unless PO/reviewer path approves. |
| Interoperability | Ledger receives intent from AR, AP, Inventory, POS, Tax and Production. | Subledger integration is first-class. | Source documents feed financial dimensions and journals. | SLA bridges operational events into GL. | Apps feed accounting moves. | Cross-domain posting semantics require architect/reviewer handoff. |

## Semantic anchors

- `journal-entry`: immutable, balanced accounting fact.
- `cost-center`: analytic dimension separate from account and branch.
- `document-splitting`: dimensional balancing pattern for reporting by branch, center or segment.
- `account-map`: governed mapping from domain behavior to account roles and concrete accounts.
- `period-close`: hard boundary for posting and correction.

## Expert decision policy

The Ledger expert can answer directly when the intent stays inside interpretation, reporting semantics, account-map explanation or non-mutating analysis.

The Ledger expert escalates when the recommendation affects historical entries, period close, document splitting, account-map mutation, cost-center policy, tax consequence, inventory valuation, migration, production deployment or tenant isolation.
