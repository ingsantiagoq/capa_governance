# FX Market Lens

Verificado: 2026-09-10. Uso: presión de diseño; no certifica implementación UBP ni cumplimiento contable.

## Patrones observados

- SAP diferencia tipos de tasa para valoración, conversión, traducción y planeación; administra monedas paralelas por ledger y revalúa partidas abiertas y cuentas de balance bajo métodos contables configurados.
- Dynamics separa tasas y fechas de revaluación, cuentas de ganancia o pérdida realizada y no realizada, y conserva historia y reversión de las corridas.
- Odoo conserva monto en moneda de transacción y equivalente en moneda principal, actualiza tasas manual o automáticamente y genera diferencias al conciliar.

## Decisiones UBP

1. Control Plane publica tasas append-only por par, tipo, fuente y vigencia; los dominios consumen una resolución reproducible `AsOf` la fecha del hecho.
2. Cada documento y asiento conserva moneda de transacción, moneda funcional, tasa, tipo, fecha, origen y política aplicada.
3. La diferencia realizada nace al conciliar; la no realizada nace en una corrida de cierre reversible. No se mezclan con diferencias de pago ni redondeo.
4. Las cuentas de ganancia, pérdida, ajuste y redondeo se resuelven por roles semánticos de `AccountMap`.
5. Revaluación y traducción de grupo son procesos distintos. Cada libro aplica moneda funcional y política contable propias.
6. Una tasa faltante, ambigua, no vigente o sin procedencia bloquea el posteo; el navegador y cada dominio consumidor no inventan conversiones.

## Fuentes oficiales

- SAP Exchange Rate Type: https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/8fbeed5f2046489696a50ac7fd76f9c6/ee9cd1538cdf4608e10000000a174cb4.html
- SAP Foreign Currency Valuation: https://help.sap.com/docs/SAP_S4HANA_CLOUD/0fa84c9d9c634132b7c4abb9ffdd8f06/8450d7531a4d424de10000000a174cb4.html
- Dynamics Bank Foreign Currency Revaluation: https://learn.microsoft.com/en-us/dynamics365/finance/cash-bank-management/bank-revaluation
- Odoo Multi-currency System: https://www.odoo.com/documentation/19.0/applications/finance/accounting/get_started/multi_currency.html
