# Document Management Market Lens

Verificado: 2026-09-10. Uso: presión de diseño; no certifica un DMS implementado en UBP ni cumplimiento legal por jurisdicción.

## Patrones observados

- SAP organiza el dominio alrededor del Document Info Record: tipo, número, versión, parte, estados, clasificación y vínculos con objetos de negocio.
- Dynamics configura tipos documentales, comportamiento de adjuntos y ubicación de almacenamiento; el repositorio no debe quedar fijado dentro de cada módulo.
- Epicor ECM integra captura, almacenamiento, clasificación, workflow, huella de integridad y trazabilidad de acceso con los sistemas ERP.
- Odoo Documents centraliza archivos, versiones, bloqueo, aliases de correo, enlaces con registros, permisos, vencimiento y digitalización.

## Decisiones UBP

1. `DocumentInfoRecord` es la identidad documental estable; cada carga crea una versión inmutable verificable por hash.
2. Un `ObjectLink` relaciona el documento con objetos de AP, AR, POS, Payroll, Inventory o Ledger sin transferir al DMS la semántica del negocio.
3. El contenido se almacena una vez y se proyecta mediante grants auditables. Compartir entre tenants exige relación consentida activa.
4. Retención, legal hold, WORM, tipos, metadatos, storage tiers y proveedores viven como política versionada en Control Plane.
5. OCR produce candidatos con fuente, confianza y trazabilidad. El dominio propietario valida antes de crear o postear una transacción.
6. La firma documental general pertenece al DMS; la firma fiscal y la respuesta de la autoridad siguen perteneciendo a Electronic Fiscal Documents.
7. Búsqueda, historial, descarga, sharing, revocación y purga deben ser explicables desde un único audit trail.

## Fuentes oficiales

- SAP Document Info Record Object Link Details: https://help.sap.com/docs/SAP_S4HANA_CLOUD/c0c54048d35849128be8e872df5bea6d/468aea57bc51f032e10000000a441470-4312.html
- Dynamics 365 Configure Document Management: https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/organization-administration/configure-document-management
- Epicor ECM: https://www.epicor.com/en/products/enterprise-content-management/ecm/
- Odoo Documents: https://www.odoo.com/documentation/19.0/applications/productivity/documents.html
