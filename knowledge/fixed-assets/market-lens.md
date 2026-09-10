# Fixed Assets Market Lens

Verificado el 2026-09-10. Estas fuentes oficiales sirven como presión de diseño; no demuestran implementación UBP.

## Lecciones del mercado

- **SAP S/4HANA FI-AA** separa las valuaciones en áreas de depreciación y configura cuáles valores pasan al GL. UBP debe modelar el libro/área y su comportamiento de posteo como dimensiones explícitas.
- **Dynamics 365 Finance** propaga adquisición, ajuste y baja desde un libro primario a libros derivados, conservando intervalos independientes. UBP debe compartir el hecho de ciclo de vida sin mezclar los cronogramas.
- **Epicor Financials** integra métodos configurables, adquisición desde AP, automatización contable y reportes planeado versus contabilizado. UBP debe unir custodia física, documento origen, board y asiento.
- **Oracle Fusion Assets** conserva versiones efectivas del libro y registra retiro o reinstalación sin destruir la historia. UBP debe versionar cambios de política y corregir con reversa/reinstalación.
- **Odoo 19** usa modelos de activo para proponer método, prorrata, board, alta desde compra y baja. UBP puede automatizar la propuesta, manteniendo aprobación y trazabilidad.

## Decisiones UBP

1. El activo se deprecia después de una capitalización aprobada; el inventario se consume o deteriora.
2. El subledger conserva costo, depreciación acumulada, valor neto, movimiento y versión de política.
3. Ledger recibe hechos semánticos y decide cuentas mediante mapas vigentes.
4. Línea recta y saldo decreciente son estrategias evidenciadas; otros métodos requieren implementación y pruebas propias.
5. La corrida es idempotente, respeta período abierto, precisión monetaria y valor residual.
6. Venta, scrap, reversa y reinstalación son eventos distintos y auditables.
7. Multi-book, reglas fiscales, vidas útiles, convenciones y límites viven en Control Plane/Country Pack.
8. El cierre exige rollforward y conciliación por entidad, libro, moneda, período y cuenta.
9. Deterioro, revaluación, CIP, altas desde AP/Inventory y traslados no se declaran listos sin evidencia E2E.
10. El ADR-0029 conserva un encabezado histórico obsoleto; el código y los CAPA auditados gobiernan el estado real.

## Fuentes oficiales

- SAP: https://learning.sap.com/courses/configuring-asset-accounting-in-sap-s4hana/defining-how-depreciation-areas-post-to-the-general-ledger
- Dynamics: https://learn.microsoft.com/en-us/dynamics365/finance/fixed-assets/derived-books
- Epicor: https://www.epicor.com/en-us/products/epicor-financials/asset-management/
- Oracle: https://docs.oracle.com/en/cloud/saas/financials/26a/oedmf/fabooks-14026.html
- Odoo: https://www.odoo.com/documentation/19.0/applications/finance/accounting/vendor_bills/assets.html
