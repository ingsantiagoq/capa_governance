# Identity & Access Market Lens

Verificado: 2026-09-10. Uso: presión de diseño; no certifica implementación UBP.

## Patrones observados

- SAP S/4HANA Cloud estructura acceso según necesidades del negocio, roles y alcance organizacional, e incorpora segregación de funciones. UBP toma la separación entre función y alcance, manteniendo las decisiones en Membership y Control Plane.
- Dynamics 365 compone roles con duties y privilegios granulares, permite asignarlos por entidad legal e incorpora segregación de funciones. UBP debe resolver `capability ∩ role ∩ scope` y auditar la decisión efectiva.
- Odoo combina permisos de modelo con record rules aplicadas al acceso de datos y reglas multiempresa. UBP adopta defensa en profundidad en cada servicio, sin depender exclusivamente del BFF.

## Decisiones UBP

1. Keycloak autentica; Membership gobierna autorización de negocio.
2. Visibilidad de menú no prueba permiso para ejecutar una acción.
3. ADMIN y OWNER son plantillas inmutables; los cambios pasan por catálogo y reconciliación.
4. El acceso efectivo debe incluir tenant, entidad legal, sucursal u otro scope tipado cuando aplique.
5. Toda denegación sensible, elevación, delegación y uso de emergencia debe ser atribuible y auditable.
6. Un cambio de rol no puede eludir SoD ni convertir al mismo humano en creador y aprobador.

## Fuentes oficiales

- SAP: https://help.sap.com/docs/SAP_S4HANA_CLOUD/53e36b5493804bcdb3f6f14de8b487dd/e818f86038a145a181b9e0e3c3b3f2f0.html
- Microsoft Dynamics 365: https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/security-strategy-product-oa
- Odoo: https://www.odoo.com/documentation/17.0/developer/tutorials/restrict_data_access.html
