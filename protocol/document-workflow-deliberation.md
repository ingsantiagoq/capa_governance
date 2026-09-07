# Document Workflow Deliberation v9

Document reception is a governed workflow, not a direct AP posting path.

## Trigger

Use this protocol when an inbound document arrives through email, upload, scan, webhook, OCR provider, portal or intercompany document exchange and may become a purchase order reference, goods receipt, vendor bill, payment authorization or accounting entry.

## Workflow roles

- Intake owner: receives the document envelope and validates source, tenant, legibility, duplicates and basic metadata.
- AP owner: validates supplier, invoice data, due date, PO reference, bill candidate and AP exceptions.
- Goods receipt owner: validates whether goods or services were received and whether Inventory or service receipt evidence exists.
- Payment owner: authorizes payment only after AP, policy and approval conditions are met.
- Ledger owner: validates posting, accounting period, account map, GR/IR, reversal and audit consequences.
- Control Plane owner: governs workflow states, role separation, approval thresholds, tolerances, capabilities, provider config and tenant policy.
- Document owner: governs document envelope, OCR provenance, object links, retention, audit trail and visibility.
- Architect: consolidates cross-domain model and event/state transitions.
- Reviewer: validates route, hard policies, gates, evidence and no skipped ownership.
- PO: signs product, scope, policy, migration and commercial decisions.

## State model

Recommended state names for analysis and CAPA design:

1. `received`: envelope created from source.
2. `extracted`: OCR or structured extraction produced candidates.
3. `triaged`: intake owner validated source, duplicate status and readable document.
4. `supplier-resolved`: supplier candidate is confirmed or exceptioned.
5. `matched`: PO/receipt/bill references are matched within policy tolerances.
6. `exception`: mismatch, low confidence, missing PO, duplicate or policy issue needs human action.
7. `ap-draft-ready`: candidate can become AP draft, not posted liability.
8. `goods-receipt-validated`: goods/service receipt is confirmed by the owning role or domain.
9. `payment-authorized`: payment authorization exists, but payment execution remains governed.
10. `accounting-approved`: Ledger can post or receive posting request under policy.
11. `posted`: accounting consequence exists through Ledger.
12. `archived`: document has final links, retention policy and audit trail.

## Hard boundaries

- Do not convert email/webhook/OCR directly into a posted AP liability.
- Do not skip intake, supplier validation, duplicate detection or provenance.
- Do not auto-approve payment without explicit policy and approval.
- Do not post accounting from the document workflow layer.
- Do not move Inventory from document reception directly.
- Do not bypass BFF review surface.
- Do not hardcode mailbox, provider, vendor, country, account, tax, tolerance, approver or workflow route.
- Do not collapse separation of duties without Control Plane policy and Reviewer approval.

## Deliberation package

For every document workflow escalation, return:

1. Current document state and next safe state.
2. Responsible owner for that transition.
3. Evidence available and missing.
4. Matching result: supplier, PO, receipt, bill, amounts, taxes, tolerances and exceptions.
5. Required approvals.
6. Domains impacted.
7. Blockers and hard boundaries.
8. Recommended workflow route.
9. Tests and gates required.
10. Broker/deliberation result: `accepted`, `accepted-with-conditions`, `needs-po-signature` or `blocked`.

## Market interpretation

Market AP automation supports capture, OCR, supplier validation, PO/receipt matching, workflow, exceptions and posting handoff. UBP should use this as comparison pressure while preserving its own architecture: document envelope first, domain ownership explicit, Control Plane policy, Ledger posting, Inventory facts and BFF review.
