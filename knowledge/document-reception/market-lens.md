# Document Reception Market Lens for UBP

Date: 2026-09-07
Status: curated comparison seed for `document-reception`; not a runtime catalog.

Document Reception is the inbound gateway from email/upload/webhook/OCR into governed business workflows. It is not AP by itself; AP is one consumer. The same capability can later serve AR, DMS, onboarding and intercompany document exchange.

## Market pattern

- Dynamics 365 Finance Invoice Capture receives invoices from external sources such as email, file servers or SharePoint, validates vendor accounts, corrects extraction errors and feeds vendor invoice automation.
- Dynamics vendor invoice automation can submit imported invoices to workflow, match receipts to invoice lines, simulate posting and show automation history.
- SAP invoice verification uses PO and goods receipt history to validate invoice quantities and amounts before payment/posting.
- Odoo digitizes vendor bills with OCR and can search for a matching purchase order before user validation.
- Epicor AP automation captures invoice data and matches against POs or receipts so staff handles exceptions instead of manual entry.

## UBP target semantics

1. Inbound source creates a document envelope, not an AP invoice immediately.
2. OCR/extraction creates structured candidates with confidence and provenance.
3. Supplier resolution is explicit and reviewable.
4. Matching checks PO, receipt and invoice, with configurable tolerances.
5. Exceptions enter workflow; clean cases can proceed to draft bill.
6. Posting remains Ledger-governed; stock remains Inventory-governed.
7. The original document is linked to every derived object through DMS metadata and object links.
8. UBP intercompany should preserve a shared document object when the supplier/customer relationship is inside the network.

## Mandatory boundaries

- Do not turn an email/webhook directly into a posted AP liability.
- Do not infer supplier, tax, account or item mapping without confidence/provenance and review policy.
- Do not hardcode mailbox, provider, country, vendor, account, tax or tolerance rules.
- Do not bypass BFF for user review.
- Do not post to Ledger or move Inventory from the reception layer.
