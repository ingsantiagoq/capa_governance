# Legal Numbering Market Lens

Verificado: 2026-09-10. Uso: presión de diseño; no certifica implementación UBP ni cumplimiento legal.

## Patrones observados

- SAP separa el número oficial del documento del número contable interno y permite rangos dependientes del año y de la sociedad. La numeración oficial debe ser única, secuencial y cronológica.
- Dynamics admite secuencias con alcance compartido, compañía, entidad legal o unidad operativa; distingue secuencias continuas y no continuas y contempla recuperación y preasignación.
- Odoo asigna el número de factura al confirmar, permite periodicidad configurable, registra cambios de secuencia, detecta huecos y restringe la resecuenciación cuando existen bloqueos, duplicados o fechas incompatibles.

## Decisiones UBP

1. El identificador interno nace en borrador y puede optimizarse; el número legal nace únicamente al emitir y nunca se reutiliza.
2. Una autorización legal define alcance, rango, prefijo, máscara, vigencia y resolución. Es recurso versionado del Country Pack y se instala por Control Plane.
3. La asignación legal debe ser transaccional y serializada por la clave completa de alcance; una secuencia de base de datos sin contexto fiscal no demuestra ausencia de huecos.
4. Una anulación conserva el número consumido y produce la evidencia o documento de cancelación exigido por la política vigente.
5. Una factura emitida conserva autorización, máscara y contexto organizacional; no se resecuencia para corregir historia.
6. Cambiar de país, sucursal, punto de emisión o año fiscal selecciona otra autorización configurada; no agrega ramas nacionales al motor.

## Fuentes oficiales

- SAP Official Document Numbering: https://help.sap.com/docs/SAP_S4HANA_CLOUD/4603118feda9495892abadbe8f8c3d14/b15cfc3e56404640af4458ff9a16eb38.html
- Dynamics Number Sequences: https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/fin-ops/organization-administration/number-sequence-overview
- Odoo Invoice Sequence: https://www.odoo.com/documentation/19.0/applications/finance/accounting/customer_invoices/sequence.html
