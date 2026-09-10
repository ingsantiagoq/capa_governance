# Localization & Country Pack Market Lens

Verificado: 2026-09-10. Uso: presión de diseño; no certifica implementación UBP ni cumplimiento legal.

## Patrones observados

- Dynamics Globalization Studio separa configuración regulatoria, facturación electrónica y cálculo fiscal, con artefactos administrados durante su ciclo de vida.
- SAP ofrece contenido localizado y puntos de extensibilidad para funciones específicas de país, incluyendo numeración oficial y configuración adaptable.
- Odoo instala paquetes fiscales por compañía que agrupan plan de cuentas, impuestos, reportes y posiciones fiscales; algunos componentes adicionales se instalan por módulo.

## Decisiones UBP

1. Un Country Pack es un artefacto versionado, firmado por hash, effective-dated y con recursos tipados.
2. Control Plane publica y gobierna el pack; los motores especializados consumen sus recursos y conservan procedencia.
3. Una diferencia nacional ordinaria se expresa como datos y políticas del pack. El código cambia únicamente ante una primitiva universal nueva.
4. Instalar o actualizar un pack debe ser idempotente, auditable y coordinado entre servicios; un estado parcial nunca se declara vendible.
5. Documentos ya emitidos conservan la versión efectiva usada para calcular, contabilizar, numerar y reportar.
6. “País soportado” exige evidencia ejecutable de punta a punta, no presencia de seeds, tablas o documentos.

## Fuentes oficiales

- Dynamics Globalization Studio: https://learn.microsoft.com/en-us/dynamics365/finance/localizations/global/globalization-studio-overview
- SAP Localization Extensibility: https://help.sap.com/docs/SAP_S4HANA_CLOUD/60a09f68f2444ceca31dcac2e7017945/350350dc15f04bcdaccff1ddf4aef611.html
- Odoo Fiscal Localizations: https://www.odoo.com/documentation/19.0/applications/finance/fiscal_localizations.html
