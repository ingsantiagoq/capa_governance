# Inventory Market Lens for UBP

Date: 2026-09-07
Status: curated comparison seed for `inventory-expert`; not a runtime catalog.

This lens keeps market knowledge separate from UBP truth. UBP facts come from ADR-0021, CAPA ADR-0021 manifests, Graphify and source code. Market references only shape options, gaps and design pressure.

## Sources

- SAP Learning: Inventory Management and Physical Inventory in SAP S/4HANA, especially movement types, reservations, availability, transfers, physical inventory, cycle counting and valuation controls. <https://learning.sap.com/courses/inventory-management-and-physical-inventory-in-sap-s-4hana/setting-up-movement-types-1>
- Microsoft Learn: Dynamics 365 Supply Chain Management warehouse management overview, including integration with purchase, sales, transfer, production, returns, quality, reservations, mobile devices, batch/serial, counting and Power BI. <https://learn.microsoft.com/en-us/dynamics365/supply-chain/warehousing/warehouse-management-overview>
- Epicor Kinetic Warehouse: mobile warehouse workflows, scan validation, bins, lots, parts, receipts, PCIDs, cycle counts, receiving, material queue and WIP movement. <https://www.epicor.com/en/products/enterprise-resource-planning-erp/epicor-kinetic/supply-chain-management/ptw-warehouse/>
- Odoo Inventory documentation: inventory app, replenishment, lots/serials and lot/serial valuation. <https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory.html>

## Comparison matrix

| Axis | UBP today from ADR-0021/CAPA | SAP pressure | Dynamics pressure | Epicor pressure | Odoo pressure | UBP direction |
|---|---|---|---|---|---|---|
| Stock authority | StockBalance and StockMovement are authoritative; kardex is append-only; no historical mutation. | Movement type controls quantity, value and account determination. | Warehouse processes integrate with purchase, sales, transfer, production, quality and returns. | Floor execution validates part, bin, lot and PCID through mobile workflows. | Stock moves, routes and locations are the operating backbone. | Keep inventory as physical truth service; publish movement semantics through configurable catalog, not enum drift. |
| Availability and reservations | Reservations and ATP exist in CAPA and must prevent oversell. | Manual reservations and availability checks are core inventory topics. | Reservations are part of warehouse management and source-document flow. | Material queue allocates work for outbound picking. | Forecast/replenishment and routes shape availability. | Expose branch-scoped ATP through BFF; PO policy decides backorder/substitution behavior. |
| Costing and valuation | Weighted average exists; multi-method, layers, valuation reporting and GL-control matrix remain design pressure. | Material valuation and movement type value strings drive financial effect. | Inventory integrates with financial and reporting processes. | Operational traceability and visibility support cost control. | Inventory valuation can use lots/serials in configured scenarios. | Preserve costing as strategy; evolve to part-site method, layers and account-role mapping before richer posting. |
| Traceability | Lot support exists in CAPA; serial, FEFO and genealogy are backlog pressure. | Batch/valuation, shelf-life checks and stock determination are configured controls. | Batch and serial item support plus quality integration are WMS features. | Serial and lot tracking are explicit warehouse capabilities. | Lots and serial numbers are documented product tracking features. | Make traceability optional by item policy; never force all tenants into heavy warehouse complexity. |
| Physical warehouse | Branch, warehouse and IN_TRANSIT are modeled; bins, handhelds and cycle counts are backlog. | Transfers, physical inventory, cycle counting and special stock are standard domain areas. | Work templates, location directives, mobile devices, counting and quality are core setup concerns. | Scan-driven receiving, material management, cycle counts and material queues are key differentiators. | Warehouses, locations, routes and barcode operations shape daily execution. | Add bins and mobile workflows only behind capability flags; keep BFF as the only user-facing edge. |
| Interoperability | Inventory feeds AR, AP, POS, Production, Tax, Ledger and Edge, but must not own those domains. | Account grouping and reversal/follow-on movements show that inventory events carry financial consequences. | Warehouse module is explicitly integrated with other business processes. | Kinetic warehouse is real-time integrated with ERP. | Inventory routes connect purchasing, manufacturing and sales flows. | Publish clear event and command contracts; Context Broker escalates any cross-domain semantic change. |

## Expert decision policy

The Inventory expert can answer directly when the intent stays inside these boundaries:

- Availability, on-hand, ATP and reservation behavior.
- Item, UoM, branch, warehouse, lot and kardex interpretation.
- Replenishment recommendations when they do not create AP documents automatically.
- Comparison of UBP inventory behavior against SAP, Dynamics, Epicor and Odoo patterns.
- Identification of gaps already declared in ADR-0021/CAPA.

The Inventory expert must escalate when the recommendation affects:

- Ledger posting, valuation account determination, period close or GL-control matrix.
- Tax calculation, jurisdiction, fiscal summaries or electronic document consequences.
- AP receipts, AR/POS fulfillment, production consumption, intercompany edge sync or offline behavior.
- Costing policy, stock type semantics, negative stock, reservations policy, migration or production rollout.

## Non-goals

- Do not treat SAP, Dynamics, Epicor or Odoo as automatic target architecture.
- Do not copy market terminology into UBP contracts unless the UBP ADR accepts it.
- Do not let the expert bypass BFF, tenant isolation, CAPA gates or source-code verification.
- Do not use this market lens as proof that a UBP capability exists; it only provides comparison pressure.
