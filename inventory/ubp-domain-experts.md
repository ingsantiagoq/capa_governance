# Inventario inicial de Domain Experts para UBP

Estado: borrador para deliberación  
Fecha de corte: 2026-09-09  
Base de gobierno: CAPA Governance V10  
Fuente de verdad funcional y técnica: código y ADR de UBP

El estado operativo de este inventario se publica en [`ubp-domain-expert-registry.json`](ubp-domain-expert-registry.json). Este documento conserva el razonamiento, las fronteras y la secuencia; el Registry es la entrada ejecutable del gate.

## Propósito

Este inventario identifica los Domain Experts que CAPA Governance necesita para enrutar intenciones, obtener contexto especializado, detectar impactos cruzados y escalar decisiones. No asigna personas todavía: define los puestos de autoridad que UBP debe cubrir y la evidencia mínima para convertir cada uno en un manifiesto V10 aprobado.

La unidad de inventario es una autoridad de dominio estable. Un ADR, un servicio o una tecnología por sí solos no crean un Domain Expert. El criterio es que exista un conjunto coherente de decisiones de negocio, vocabulario, invariantes y riesgos que necesite una autoridad primaria.

## Reglas de diseño del catálogo

1. Una intención debe tener un único experto primario.
2. Los expertos impactados participan por handoff; no comparten la autoridad primaria de la intención.
3. PO, arquitecto, reviewer y compliance son roles de gobierno. No sustituyen al experto del dominio.
4. Cada experto debe poder citar código, contratos, ADR y políticas externas aplicables.
5. Los dominios aspiracionales pueden registrarse antes de existir en código, pero su estado debe ser explícito y sus fuentes no pueden fingir implementación.
6. Un manifiesto de ejemplo no equivale a un experto aprobado para producción.

## Cobertura que ya existe en CAPA Governance

| Expert ID | Dominio | Cobertura declarada | Estado real |
|---|---|---|---|
| `control-plane-expert` | Control Plane | `control-plane`, `cost-center`, `accounting-segmentation` | Ejemplo V10; falta dueño, suplente, aprobación y validación contra el grafo UBP actual |
| `ledger-expert` | Ledger | `ledger`, `cost-center`, `accounting-segmentation` | Ejemplo V10; falta elevarlo a catálogo aprobado |
| `inventory-expert` | Inventarios | `inventory`, `cost-center`, `accounting-segmentation` | Ejemplo V10; falta elevarlo a catálogo aprobado |
| `ar-expert` | Cuentas por cobrar | `ar` | Ejemplo V10; falta elevarlo a catálogo aprobado |
| `ap-expert` | Cuentas por pagar | `ap`, `document-reception` | Ejemplo V10; la recepción documental debe separarse cuando el documento cruza AP |

Los cinco manifiestos son una base útil, pero el propio repositorio los presenta como ejemplos. Además, `protocol/domain-experts.md` todavía describe publicación `version = 2`, mientras que el esquema y los ejemplos exigen V10. Esa deriva debe corregirse antes de declarar el catálogo operativo.

## Inventario requerido

### Ola 0 — soberanía, cumplimiento e integridad

Estos expertos intervienen en decisiones que pueden alterar libros, obligaciones, acceso, trazabilidad o configuración soberana. Deben existir antes de permitir deliberaciones CAPA autónomas sobre contabilidad.

| Prioridad | Expert ID propuesto | Autoridad primaria | Evidencia UBP | Estado |
|---|---|---|---|---|
| P0 | `control-plane-expert` | Catálogo de capabilities, planes, configuración soberana y plantillas organizacionales | `ubp-admin-service`; ADR-0005, ADR-0006 | Ejemplo V10 por aprobar |
| P0 | `ledger-expert` | Plan de cuentas, libros, diarios, periodos, reglas de contabilización y saldos | `ubp-ledger-service`; ADR-0011, ADR-0016 | Ejemplo V10 por aprobar |
| P0 | `tax-expert` | Determinación tributaria, códigos, asignaciones, nexus, redondeo y evidencia fiscal | `ubp-tax-service`; ADR-0010 | Faltante |
| P0 | `identity-access-expert` | Identidad, membresías, roles, permisos, firmas contables, acceso de emergencia y segregación de funciones | `ubp-membership-service`, Keycloak; ADR-0003, ADR-0081 | Faltante |
| P0 | `audit-integrity-expert` | Inmutabilidad, trazabilidad, cadena de evidencia, retención, SoD y reconstrucción de decisiones | `ubp-audit-service`, kernel de auditoría y Ledger; ADR-0009, ADR-0016 | Faltante |
| P0 | `tenant-organization-expert` | Tenant, entidad legal, firma contable, sucursal, centro de costo y límites organizacionales | Membership, Admin, Inventory; ADR-0007, ADR-0008 | Faltante; hoy la autoridad está fragmentada |
| P0 | `localization-country-pack-expert` | Paquetes país, vigencia normativa y coordinación de CoA, impuestos, numeración y contabilización | Admin y dominios fiscales; ADR-0005, ADR-0014 | Faltante |
| P0 | `legal-numbering-expert` | Autorizaciones, secuencias legales, asignación, anulaciones y no reutilización | `ubp-numbering-service`; ADR-0012 | Faltante |
| P0 | `electronic-fiscal-documents-expert` | Emisión, recepción, validación, estados, rechazo y evidencia ante autoridades fiscales | Admin, AR, AP y BTW; ADR-0013 | Faltante |
| P0 | `fx-expert` | Tasas, fuentes, vigencia, moneda funcional/transaccional, revaluación y diferencias en cambio | Ledger y consumidores financieros; ADR-0015 | Faltante; capacidad aún incompleta |
| P0 | `treasury-expert` | Bancos, caja, medios de pago, conciliación, clearing, pagos y liquidez | Ledger, POS, AR y AP; ADR-0024 | Faltante; no existe bounded context dedicado |
| P0 | `document-management-expert` | Ingesta, clasificación, expediente, retención, vínculo a objetos y cadena de custodia documental | Document Reception en Admin y consumidores; ADR-0044 | Faltante; debe recibir la autoridad transversal que hoy figura en AP |
| P0 | `workflow-approvals-expert` | Estados, transiciones, aprobaciones, delegación, escalamiento, SLA y SoD | Servicios consumidores; ADR-0042 | Faltante; capacidad aún incompleta |

### Ola 1 — operación transaccional

| Prioridad | Expert ID propuesto | Autoridad primaria | Evidencia UBP | Estado |
|---|---|---|---|---|
| P1 | `parties-expert` | Terceros, perfiles fiscales, identidades, roles comerciales y clasificaciones | `ubp-parties-service`; ADR-0020 | Faltante |
| P1 | `inventory-expert` | Ítems, bodegas, lotes, reservas, movimientos, capas y métodos de costo | `ubp-inventory-service`; ADR-0021 | Ejemplo V10 por aprobar |
| P1 | `ar-expert` | Clientes, facturas, notas, recaudos, cartera, mora y aplicación de pagos | `ubp-ar-service`; ADR-0022 | Ejemplo V10 por aprobar |
| P1 | `ap-expert` | Proveedores, órdenes, recepciones, facturas, créditos y pagos | `ubp-ap-service`; ADR-0023 | Ejemplo V10 por aprobar; retirar autoridad documental transversal |
| P1 | `pos-expert` | Sesiones de caja, órdenes, pagos, devoluciones, terminales y operación desconectada | `ubp-pos-service`; ADR-0025, ADR-0052, ADR-0081 | Faltante |
| P1 | `payroll-expert` | Vinculación laboral, tiempo, liquidación, novedades, aportes, retenciones y archivos regulatorios | `ubp-payroll-service`; ADR-0028 | Faltante |
| P1 | `fixed-assets-expert` | Alta, clasificación, depreciación, mejora, traslado, deterioro y baja de activos | `ubp-fixed-assets-service`; ADR-0029 | Faltante; el ADR debe reconciliarse con el código ya existente |
| P1 | `production-expert` | Recetas, insumos, rendimientos, consumo y transformación de inventario | `ubp-production-service`; ADR-0026 | Faltante; implementación inicial |
| P1 | `b2b-intercompany-expert` | Relaciones comerciales, consentimientos, documentos entre compañías, contraparte y eliminación intercompany | `ubp-b2b-service`; ADR-0027, ADR-0040, ADR-0045 | Faltante |
| P1 | `financing-credit-expert` | Planes, cuotas, interés, mora, refinanciación y asignación de recaudos | AR y consumidores comerciales; ADR-0036 | Faltante |
| P1 | `logistics-fulfillment-expert` | Despacho, entrega, transportador, trazabilidad logística, devoluciones y prueba de entrega | Inventario, POS y B2B; ADR-0041 | Faltante; capacidad aún incompleta |

### Ola 2 — plataforma, experiencia e inteligencia

| Prioridad | Expert ID propuesto | Autoridad primaria | Evidencia UBP | Estado |
|---|---|---|---|---|
| P2 | `notifications-expert` | Plantillas, preferencias, canales, entrega, reintento y evidencia de comunicación | `ubp-notification-service`; ADR-0031 | Faltante; dominio sin entidades propias visibles |
| P2 | `analytics-bi-expert` | Modelo semántico, métricas, dimensiones, agregaciones, frescura y autorización analítica | BFF/reporting y servicios fuente; ADR-0032 | Faltante |
| P2 | `ai-assistant-expert` | Conocimiento recuperable, memoria, auditoría de interacción, consumo, guardrails y evaluación | `ubp-assistant-service`; ADR-0043, ADR-0090 | Faltante |
| P2 | `platform-reliability-expert` | Operabilidad, observabilidad, resiliencia, tenancy de infraestructura y recuperación | Building blocks y despliegue; ADR-0001, ADR-0004 | Faltante; autoridad técnica transversal |
| P2 | `integration-events-expert` | Contratos, outbox/inbox, idempotencia, orden, replay, compatibilidad y APIs de plataforma | Protos, building blocks y servicios; ADR-0001, ADR-0016, ADR-0045, ADR-0050 | Faltante; autoridad técnica transversal |
| P2 | `experience-delivery-expert` | BFF, navegación, diseño de interacción, formatos impresos y coherencia de experiencia | BFF y `ubp-app`; ADR-0002, ADR-0030, ADR-0034, ADR-0035, ADR-0055 | Faltante; autoridad de producto transversal |

Resultado inicial: **30 autoridades de dominio**: 5 con manifiesto de ejemplo y 25 sin manifiesto. Este número es una hipótesis de catálogo, no una decisión cerrada. La deliberación puede fusionar expertos si conservan vocabulario e invariantes coherentes, o dividirlos si el enrutamiento produce autoridad ambigua.

Todos comienzan como `candidate`. Los cinco manifests existentes tampoco pasan a `active` por existir: necesitan dueño, suplente, aprobación, digest, revisión vigente y semillas verificadas contra el commit UBP declarado.

## Auditoría inicial de semillas

La auditoría reproducible en [`ubp-existing-expert-seed-audit.json`](ubp-existing-expert-seed-audit.json) evaluó los cinco manifests existentes contra el índice Graphify generado desde UBP `8a90e057c5e65d536163bba01ed30adc9c209b13`.

| Expert ID | Resueltas | Ambiguas | Ausentes | Decisión |
|---|---:|---:|---:|---|
| `ap-expert` | 9 | 0 | 2 | `BLOCK` |
| `ar-expert` | 0 | 0 | 6 | `BLOCK` |
| `control-plane-expert` | 6 | 5 | 4 | `BLOCK` |
| `inventory-expert` | 16 | 0 | 2 | `BLOCK` |
| `ledger-expert` | 9 | 0 | 2 | `BLOCK` |
| **Total** | **40** | **5** | **16** | **BLOCK** |

Los faltantes de AP, Inventory y Ledger son principalmente knowledge lenses y policies alojadas en Governance, fuera del índice UBP auditado. AR usa seis descripciones conceptuales que no resuelven como nodos. Control Plane combina fuentes externas al índice, como protos, con nombres de servicios que producen varios nodos. Ningún experto obtiene `seedVerificationSha256` mientras conserve una semilla ausente o ambigua.

## Fronteras y handoffs obligatorios

| Intención | Experto primario | Handoffs mínimos según impacto |
|---|---|---|
| Cambiar una regla de contabilización | `ledger-expert` | Control Plane, Tax, Audit Integrity y dominios que originan el asiento |
| Crear o modificar un impuesto | `tax-expert` | Localization, Ledger, Electronic Fiscal Documents y Control Plane |
| Emitir una factura de venta | `ar-expert` | Tax, Legal Numbering, Electronic Fiscal Documents y Ledger |
| Recibir un documento por correo/API/OCR | `document-management-expert` | AP, AR u otro dueño del proceso después de clasificar y aceptar el candidato |
| Registrar una factura de proveedor | `ap-expert` | Parties, Tax, Document Management, Treasury y Ledger |
| Cerrar una venta POS | `pos-expert` | Inventory, AR, Tax, Treasury, Legal Numbering y Ledger |
| Liquidar nómina | `payroll-expert` | Parties, Tax, Treasury, Legal Numbering, Electronic Fiscal Documents y Ledger |
| Activar un paquete país | `localization-country-pack-expert` | Control Plane, Tax, Ledger, Numbering, Electronic Fiscal Documents y FX |
| Cambiar roles o permisos contables | `identity-access-expert` | Audit Integrity y dueño del dominio protegido; PO/compliance cuando corresponda |
| Crear una métrica o respuesta asistida | `analytics-bi-expert` o `ai-assistant-expert`, según la intención | Dueños de datos, Identity & Access y Audit Integrity |

La recepción documental tiene una frontera especialmente sensible. `document-management-expert` gobierna el documento como evidencia y candidato; `ap-expert` gobierna la obligación con proveedor una vez aceptada. Esta separación evita que AP se convierta en dueño accidental de documentos de ventas, nómina, activos o impuestos.

## Roles que no deben modelarse como Domain Experts

| Rol | Poder en CAPA Governance |
|---|---|
| Product Owner | Acepta cambios de alcance, ADR, AC de épicas, decisiones comerciales y compliance; en UBP esta firma corresponde a Santiago |
| Arquitecto | Resuelve consistencia de arquitectura, límites, contratos y efectos sistémicos |
| Reviewer adversarial | Busca fallas, evidencia insuficiente, regresiones y cumplimiento de gates |
| Compliance | Dictamina cuando una decisión exige interpretación regulatoria o evidencia formal |
| Agente implementador | Ejecuta dentro del CAPA y de las políticas; no se autoatribuye autoridad de dominio |

Una misma persona puede ocupar uno de estos roles y también ser Domain Expert, pero CAPA debe registrar qué autoridad está ejerciendo en cada decisión.

## Datos de gobierno que faltan fuera del manifiesto V10

El manifiesto V10 describe la competencia del experto, pero no permite registrar responsabilidad humana sin romper su esquema cerrado. CAPA Governance necesita un registro complementario con, como mínimo:

| Campo | Uso |
|---|---|
| `expertId` | Referencia exacta al manifiesto V10 |
| `accountableOwner` | Persona que responde por la autoridad de dominio |
| `backupOwner` | Suplente para continuidad y revisión cruzada |
| `status` | `candidate`, `active`, `suspended` o `retired` |
| `approvedRevision` | Commit o tag del manifiesto aprobado |
| `approvedBy` | Firma de gobierno aplicable |
| `reviewCadence` | Frecuencia de revisión de fuentes, anclas y políticas |
| `lastGraphValidation` | Grafo/commit contra el que resolvieron los seed nodes |
| `coverageGaps` | Intenciones conocidas que todavía no puede resolver |

Este registro no debe duplicar `scope`, capabilities, fuentes ni políticas del manifiesto. Solo agrega identidad, vigencia y trazabilidad de aprobación.

## Vacíos de gobierno detectados

1. **Deriva de versión:** el protocolo todavía habla de manifests V2, pero el schema y los ejemplos son V10.
2. **Ejemplos sin promoción:** no existe evidencia en el repositorio de que los cinco expertos actuales sean un catálogo de producción aprobado.
3. **Cobertura incompleta:** siete capability manifests existentes no representan la mayoría de los bounded contexts implementados en UBP.
4. **Responsabilidad humana ausente:** el esquema no contiene dueño, suplente, vigencia ni firma de aprobación.
5. **Ambigüedad potencial:** `cost-center` y `accounting-segmentation` aparecen en Control Plane, Inventory y Ledger. El broker depende de que la intención declare correctamente el dominio primario.
6. **Frontera documental incorrecta:** AP figura como dueño de `document-reception`, aunque el alcance real cruza múltiples dominios.
7. **ADRs desfasados del código:** Fixed Assets y Assistant ya tienen implementación, mientras sus ADR conservan estados históricos parciales o nulos.
8. **Dominios sin bounded context:** Treasury, FX, Workflow y Logistics necesitan expertos para gobernar diseño futuro, pero el manifiesto debe declarar con honestidad que aún no hay implementación soberana completa.

## Criterio de activación de un experto

Un candidato pasa a `active` únicamente cuando cumple todo lo siguiente:

- existe un capability manifest publicado para cada capability que reclama;
- el `domain` permite selección primaria inequívoca;
- hay dueño y suplente designados;
- todos los seed nodes resuelven contra un grafo UBP fijado por commit;
- las fuentes UBP citan artefactos reales y las fuentes de mercado tienen lente explícita;
- los semantic anchors cubren vocabulario, invariantes y casos límite;
- las políticas incluyen evidencia, prohibiciones y escalamiento por impacto cruzado;
- todos los handoff targets existen y no crean ciclos sin responsable primario;
- validator y pruebas del broker pasan;
- la revisión adversarial y la firma de gobierno quedaron registradas.

## Secuencia recomendada

1. Corregir la deriva V2/V10 del protocolo y definir el registro humano complementario.
2. Validar y promover los cinco manifests existentes contra el commit actual de UBP.
3. Publicar primero `tax`, `identity-access`, `audit-integrity`, `tenant-organization`, `localization-country-pack`, `legal-numbering`, `electronic-fiscal-documents`, `treasury` y `document-management`.
4. Ajustar AP para transferir la autoridad transversal de recepción documental.
5. Completar la ola transaccional usando los servicios y ADR existentes.
6. Incorporar los dominios aspiracionales con estado y límites explícitos, sin presentar ADR como implementación.
7. Ejecutar una auditoría de enrutamiento con intenciones representativas y comprobar que cada una obtiene un solo experto primario.
