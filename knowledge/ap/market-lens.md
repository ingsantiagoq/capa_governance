# AP Market Lens for UBP

Date: 2026-09-07
Status: curated comparison seed for `ap-expert`; not a runtime catalog.

This lens keeps market knowledge separate from UBP truth. UBP facts come from ADR-0023, ADR-0044, CAPA manifests, Graphify and source code. Market references shape procure-to-pay semantics, not implementation claims.

## Sources

- Microsoft Learn: Automated vendor invoicing processes in Dynamics 365 Finance. <https://learn.microsoft.com/en-us/dynamics365/finance/accounts-payable/auto-vendr-invc-process>
- Microsoft Learn: Invoice capture features and functionality for Dynamics 365 Finance. <https://learn.microsoft.com/en-us/dynamics365/guidance/techtalks/finance-invoice-capture-ga-features-functionality>
- SAP Learning: Invoice Verification in SAP S/4HANA, GR-based matching of goods receipts and invoices in PO history. <https://learning.sap.com/courses/invoice-verification-in-sap-s-4hana/using-different-types-of-invoice-verification>
- Odoo documentation: Vendor bill digitization and OCR matching to purchase orders. <https://www.odoo.com/documentation/19.0/applications/finance/accounting/vendor_bills/invoice_digitization.html>
- Epicor ECM AP Automation: capture inbound invoices and match against purchase orders or receipts. <https://www.epicor.com/en/products/enterprise-content-management/ecm/ap-automation/>

## Comparison matrix

| Axis | UBP context | SAP pressure | Dynamics pressure | Epicor pressure | Odoo pressure | UBP direction |
|---|---|---|---|---|---|---|
| Document intake | ADR-0044 declares incoming capture/OCR/inbox as a needed DMS capability; ADR-0023 has AP receipt but not complete vendor bill workflow. | Invoice verification matches invoice items against GR/PO history. | Invoice capture handles multiple external sources and vendor validation. | AP automation captures key invoice data from inbound documents. | OCR digitizes vendor bills and can match a PO. | Publish document-reception as capability feeding AP, not as ad hoc email parsing. |
| Matching | ADR-0023 says three-way-match and GR/IR are missing. | GR-based IV uniquely assigns invoice item to goods receipt item. | Automation can match product receipts to pending vendor invoice lines. | Matches inbound invoices to POs or receipts. | Recognized bills can be manually matched to POs. | Model PO/receipt/bill matching with tolerances and exception workflow. |
| Accounting | Today receipt can move stock and post AP directly; target needs Vendor Bill and GR/IR. | Invoice verification separates receipt history and invoice posting. | Posting simulation and workflow precede posting. | ERP integration populates accounting fields automatically. | Vendor bills create accounting moves after review. | Move to bill-centered AP with GR/IR clearing and Ledger-governed posting. |
| Workflow | CAPA has document reception and AP gaps; approval/workflow is cross-domain. | Invoice blocks and discrepancy processing protect payment. | Workflow and automation history are first-class. | AP clerks review exceptions, not every keystroke. | OCR reduces entry but still expects user validation. | Use status network: received, extracted, validated, matched, exception, approved, posted. |
| Interoperability | UBP can differentiate by document sharing through B2B relationship and edge. | SAP mostly assumes one ERP instance/company group. | Dynamics integrates within finance/supply chain. | Epicor ECM integrates with ERP and external systems. | Odoo links Documents, Purchase and Accounting. | UBP should preserve one document object linked to supplier, PO, receipt, bill and shared relationship. |

## Expert decision policy

The AP expert can answer directly when the intent stays inside non-mutating analysis of vendor invoice lifecycle, AP receipt, bill creation, due dates, aging, matching concepts or exception triage.

The AP expert escalates when the recommendation affects Ledger posting, Inventory receipt/costing, Tax calculation, Document Management ownership, BFF/UI workflow, email/webhook security, OCR extraction policy, approvals, production deployment or historical migration.
