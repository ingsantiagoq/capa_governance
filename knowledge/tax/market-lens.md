# Tax Market Lens

Verified: 2026-09-09. Refresh within 120 days. Official product documentation is comparison evidence, never proof of UBP implementation.

## Microsoft Dynamics 365

Tax Calculation separates a transaction payload from a configurable, versioned calculation feature. Its model covers applicability matrices, formulas, registrations, jurisdictions and broad transaction types. UBP should preserve the same separation while keeping one canonical policy publication path through Control Plane.

Source: <https://learn.microsoft.com/en-us/dynamics365/finance/localizations/global/global-tax-calcuation-service-overview>

## Oracle Fusion Tax

Oracle decomposes determination into regimes, place of supply, applicability, registration, status, rate, taxable basis, calculation and recovery. UBP should use this as pressure for an explicit ordered determination graph; a flat list plus family dedup is insufficient for complex legislation.

Source: <https://docs.oracle.com/en/cloud/saas/financials/26a/fautx/tax-determination.html>

## Odoo

Fiscal positions map taxes and accounts based on partner and geography. Repartition lines and tax grids connect computation, journal effects and statutory reports. UBP should model fiscal position, repartition and tags declaratively while avoiding localization code modules as the ordinary update path.

Sources:

- <https://www.odoo.com/documentation/16.0/applications/finance/accounting/taxes/fiscal_positions.html>
- <https://www.odoo.com/documentation/19.0/applications/finance/accounting/reporting/tax_returns.html>

## SAP

SAP Localization Hub exposes tax configuration and third-party provider routing with tenant-specific configuration and audit concerns. UBP should preserve provider independence behind a universal interface and keep credentials and routing separate from tax policy semantics.

Source: <https://help.sap.com/doc/9c561e59168e4ed98abb6c1df315b33d/Cloud/en-US/SLH_Tax_Service_Security_PDF_en.pdf>

## UBP decisions

1. Tax determination is an ordered policy graph, not a country switch.
2. Every leg carries treatment, timing, account role and tax tags.
3. Country Packs publish executable tax resources with version, effective date, hash and migration.
4. Transaction domains send facts and consume results; Tax owns determination.
5. Statutory reporting is data-defined from tags and report lines, not a country-specific service branch.
