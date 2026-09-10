# Treasury Market Lens

Verificado: 2026-09-10. Uso: presión de diseño; no certifica implementación UBP, conectividad bancaria ni controles financieros.

## Patrones observados

- SAP usa cuentas y subcuentas bancarias de tránsito para enlazar corridas de pago con extractos y facilitar su compensación posterior.
- Dynamics construye propuestas de pago sobre obligaciones seleccionadas y cuentas bancarias, separando preparación, revisión y ejecución.
- Odoo mantiene pagos en cuentas outstanding hasta conciliarlos con la transacción bancaria; soporta pagos parciales, lotes, matching automático, modelos de conciliación y write-offs controlados.

## Decisiones UBP

1. Tesorería es dueña del movimiento de dinero; AR/AP conservan la obligación y Ledger conserva el asiento.
2. Cobros y pagos pasan por cuentas de tránsito configuradas. El banco se afecta al depositar, liquidar o conciliar.
3. Un `Settlement` explica bruto, comisiones, descuentos, devoluciones y neto. El proveedor de pagos es un adaptador.
4. La línea bancaria y el movimiento interno son hechos independientes hasta que una conciliación auditable los relaciona.
5. Propuestas y ejecuciones de pago son estados distintos y requieren segregación de funciones, límites y aprobación.
6. Formatos bancarios, medios de pago, rutas contables, tolerancias y reglas de matching viven en Control Plane.

## Fuentes oficiales

- SAP Bank Accounts and Subaccounts: https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/848f8ce21bcd4f67bce77494799e2257/1e04c55368511d4be10000000a174cb4.html
- Dynamics Vendor Payment Proposals: https://learn.microsoft.com/en-us/dynamics365/finance/accounts-payable/create-vendor-payments-payment-proposal
- Odoo Payments: https://www.odoo.com/documentation/19.0/applications/finance/accounting/payments.html
- Odoo Bank Reconciliation: https://www.odoo.com/documentation/19.0/applications/finance/accounting/bank/reconciliation.html
