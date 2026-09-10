# Electronic Fiscal Documents Market Lens

Verificado: 2026-09-10. Uso: presión de diseño; no certifica implementación UBP, homologación ni cumplimiento legal.

## Patrones observados

- Dynamics ofrece el procesamiento electrónico como servicio multitenant configurable: transforma datos, transmite a servicios externos, procesa respuestas, firma cuando aplica y conserva trazabilidad. La configuración se empaqueta y reutiliza entre compañías.
- Peppol BIS Billing separa un modelo semántico común de las reglas nacionales de validación; las reglas específicas se activan por el país del proveedor.
- Odoo genera documentos EDI desde facturas confirmadas, elige formatos según contexto y usa puntos de acceso Peppol para enviar facturas y notas y recibir documentos.

## Decisiones UBP

1. El hecho comercial emitido y numerado es la fuente; el documento electrónico es una proyección fiscal correlacionada e inmutable.
2. En la frontera vigente, BTW transforma, firma, calcula CUFE, transmite y devuelve estado y artefactos. UBP no duplica esas funciones.
3. UBP conserva un adaptador de proveedor reemplazable. Credenciales, endpoints, ambiente, tipos habilitados y modelo de clearance son configuración versionada.
4. Un resultado ambiguo se reconcilia antes de reenviar. Un HTTP exitoso sin identificador fiscal no demuestra aceptación.
5. La venta interna permanece registrada ante indisponibilidad fiscal y queda visible para remediación; su estado fiscal nunca se oculta.
6. Cada tipo documental y cada país requieren contrato, política y evidencia E2E propios con un proveedor o autoridad real.

## Fuentes oficiales

- Dynamics Electronic Invoicing: https://learn.microsoft.com/en-us/dynamics365/finance/localizations/global/gs-e-invoicing-service-overview
- OpenPeppol Country-specific Validation Policy: https://docs.peppol.eu/poac/policies/OpenPeppol%20Policy%20on%20BIS%20Billing%20Country%20specific%20validation%20rules%20v1.1.0.pdf
- Odoo Electronic Invoicing: https://www.odoo.com/documentation/19.0/applications/finance/accounting/customer_invoices/electronic_invoicing.html
