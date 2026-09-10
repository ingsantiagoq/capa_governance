# Tenant & Organization Market Lens

Verificado: 2026-09-10. Uso: presión de diseño; no certifica implementación UBP.

## Patrones observados

- SAP combina unidades organizativas de Finanzas, Ventas y Compras; una organización de ventas se asigna a un company code y los cruces entre company codes generan procesos intercompany.
- Dynamics distingue entidad legal de unidad operativa. La entidad legal sostiene obligaciones estatutarias, moneda y cierres; las unidades operativas controlan recursos y procesos. Sus jerarquías tienen propósito, versión y vigencia.
- Odoo permite varias compañías y sucursales, con datos compartidos o restringidos según compañía. Esa flexibilidad exige definir con precisión qué registros son globales y cuáles pertenecen a una empresa.

## Decisión vigente UBP

1. `Identidad global → TenantMembership → Tenant (empresa operativa) → Branch → Warehouse`.
2. Tenant es el límite de datos, permisos, configuración, facturación y balance.
3. Un usuario trabaja con varias empresas mediante membresías en varios tenants y un tenant activo.
4. `LegalEntity` es una coordenada interna/default transitoria mientras sobrevivan documentos históricos; no es un maestro elegible ni una superficie de navegación.
5. Branch pertenece a un tenant y sus hechos no pueden reasignarse silenciosamente a otra empresa.
6. Intercompany y consolidación relacionan tenants mediante contratos explícitos; no crean subempresas dentro del tenant.

## Fuentes oficiales

- SAP Organizational Structures: https://help.sap.com/docs/SAP_S4HANA_CLOUD/a376cd9ea00d476b96f18dea1247e6a5/b321b953495bb44ce10000000a174cb4.html
- Dynamics organizational hierarchy: https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/fin-ops/organization-administration/plan-organizational-hierarchy
- Odoo multi-company: https://www.odoo.com/documentation/19.0/applications/general/companies/multi_company.html
