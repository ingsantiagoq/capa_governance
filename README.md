# CAPA Governance v11

El conocimiento se publica, no se busca.

CAPA Governance es el protocolo de conocimiento gobernado por encima de UBP
(Unified Business Platform). Define como resolver una capacidad, entregar su
contexto minimo y decidir si alcanza para una tarea. UBP conserva la ejecucion
y la logica de negocio. Este repositorio central contiene especificacion,
ejemplos y funciones de referencia pequenas; no es un framework de agentes.

Los Capability Manifests y Domain Expert Manifests versionados son la fuente
oficial. En v11, los expertos de dominio declaran fuentes UBP, fuentes de mercado y politicas transversales explicitas. La nueva politica `accounting-segmentation-engine` formaliza el motor contable segmentado configurable: cuenta natural mas segmentos tipados, con DisplayCode derivado y mascaras gobernadas por Control Plane. Una intencion tiene un experto primario; solo se escala por riesgo o
impacto entre dominios. El Context Pack conserva
sus siete campos. El Capability Router aplica manifest-first, graphify-second,
source-last. El Context Broker produce ready, expand, escalate o block mediante
una funcion pura testeable. El skill solo adapta el protocolo a una conversacion;
no publica conocimiento ni reemplaza gates o permisos.

## Ejecutar

Requiere Node >=22, sin dependencias externas ni npm install:

```sh
npm run check
node tools/validate-capability-manifests.mjs examples/*.manifest.json catalog/ubp/experts/*.json catalog/ubp/capabilities/*.json
node tools/audit-expert-seeds.mjs graph.json catalog/ubp/experts/*.json \
  --graph-revision <ubp-commit> --output seed-audit.json
```

El validador falla con codigo 1 ante JSON invalido, archivos ausentes, campos
faltantes, politicas vacias, semillas vacias, propiedades adicionales o IDs
duplicados en el catalogo recibido. Sin argumentos valida examples desde la
ubicacion del script, independientemente del directorio actual. Los argumentos
son rutas explicitas; el shell expande el glob sin comillas.

Implementa exclusivamente los keywords de los schemas incluidos (JSON Schema
2020-12), rechazando keywords desconocidos al cargarlo. No es un motor JSON
Schema general. Al ampliar el schema, ampliar y probar el validador o adoptar
una implementacion completa. No valida existencia de nodos, frescura ni permisos.

## Contenido

- [Inventario inicial de Domain Experts UBP](inventory/ubp-domain-experts.md):
  30 autoridades candidatas, cobertura actual, fronteras, handoffs y secuencia de activacion.
- [Registry UBP](inventory/ubp-domain-expert-registry.json): estado operativo y revision de código usada por el gate.
- [Auditoria inicial de semillas](inventory/ubp-existing-expert-seed-audit.json): resolución determinista de los seis expertos existentes contra el índice UBP fijado.
- [Readiness de Tax](inventory/tax-expert-readiness.md): balance entre capacidad real del motor y brechas que bloquean soberanía de país.
- [Evidencia de soberanía Tax](inventory/tax-sovereignty-evidence.json) y [gate ejecutable](tools/engine-sovereignty-gate.mjs): diez etapas desde publicación en Control Plane hasta handoff contable, fijadas a una revisión UBP.
- [Gate PO](tools/po-governance-gate.mjs) y [política de ratchet](inventory/po-governance-policy.json): cruzan Registry, manifests, auditoría de semillas y soberanía. El pipeline falla si un experto activo pierde evidencia o si un experto requerido deja de estar `READY`.
- [Governance Readiness Gate](protocol/governance-readiness-gate.md) y
  [Registry schema](schemas/domain-expert-registry.schema.json): evidencia objetiva para bloquear o habilitar el Context Broker.
- [Autoridad PO](protocol/po-authority.md) y [motor de decisión](tools/po-decision.mjs): convierten una intención normalizada en `GO`, `NEEDS_EVIDENCE`, `ESCALATE` o `BLOCK` y adjuntan los fundamentos de producto.
- [Ejecución gobernada de Claude](protocol/claude-governed-execution.md): exige `/ultraplan`, `/goal`, `/agent`, `/ultrareviewer` y evidencia Graphify ordenada; los hooks bloquean edición o cierre cuando falta el contrato.
- [Capability schema](schemas/capability-manifest.schema.json): contrato v1 cerrado.
- [Expert schema](schemas/domain-expert-manifest.schema.json) y
  [protocolo de expertos](protocol/domain-experts.md): seleccion determinista; contrato de conocimiento v11.
- [Experto AR](examples/ar.expert.manifest.json): cuentas por cobrar y gates;
  anclas propuestas pendientes de verificar contra UBP.
- [Experto Inventario](examples/inventory.expert.manifest.json): dominio concreto derivado de ADR-0021 y CAPAs de inventario;
  separa verdad UBP, lentes de mercado, limites de dominio y escalamiento.
- [Catálogo UBP aprobado](catalog/ubp/approved-catalog.json): índice consumible de autoridades, capacidades y evidencia vigentes.
- [Experto AP](catalog/ubp/experts/ap.expert.manifest.json): compras y cuentas por pagar, recepción documental, matching, excepciones y handoff contable.
- [Experto Ledger](catalog/ubp/experts/ledger.expert.manifest.json): gobierno contable, dimensiones, centros de costo, periodos y posteo.
- [Experto Tax](catalog/ubp/experts/tax.expert.manifest.json): determinación tributaria, soberanía por Country Pack, vigencias, legs, posiciones fiscales y reporte declarativo.
- [Tax Market Lens](knowledge/tax/market-lens.md): comparación oficial contra Dynamics, Oracle, Odoo y SAP con decisiones explícitas para UBP.
- [Experto Control Plane](catalog/ubp/experts/control-plane.expert.manifest.json): capabilities, permisos, configuracion por tenant y politicas runtime.
- [Inventory Market Lens](knowledge/inventory/market-lens.md): comparacion curada contra SAP, Dynamics, Epicor y Odoo;
  funciona como presion de diseno, no como prueba de implementacion UBP.
- [Ledger Market Lens](knowledge/ledger/market-lens.md): comparacion curada para asientos, dimensiones, centros de costo, periodos y account maps.
- [Control Plane Market Lens](knowledge/control-plane/market-lens.md): comparacion curada para capabilities, permisos, politicas por tenant y provisioning.
- [Context Pack](protocol/context-pack.md): siete campos y procedencia.
- [Broker](protocol/context-broker-state-machine.md): prioridades y transiciones.
- [Router](protocol/capability-router.md): resolucion de intencion y recuperacion.
- [Inventory](examples/inventory.manifest.json) conserva estado de ejemplo.
  [AP](catalog/ubp/capabilities/ap.manifest.json), [Document Reception](catalog/ubp/capabilities/document-reception.manifest.json),
  [Ledger](catalog/ubp/capabilities/ledger.manifest.json),
  [Cost Center](catalog/ubp/capabilities/cost-center.manifest.json),
  [Accounting Segmentation](catalog/ubp/capabilities/accounting-segmentation.manifest.json),
  [Control Plane](catalog/ubp/capabilities/control-plane.manifest.json) y
  [Tax](catalog/ubp/capabilities/tax.manifest.json) pertenecen al catálogo aprobado.
- [Adaptador](skills/ubp-context-broker/SKILL.md): arranque de tareas UBP.
- tools/: validador y broker puro; test/: casos positivos, negativos y transiciones.

Las semillas son referencias logicas curadas a ADRs, contratos y simbolos de las
pruebas anteriores. Deben resolverse sin ambiguedad contra el indice fijado del
consumidor antes de usarse. No se inventan IDs Graphify ni rutas de archivos.
Las restricciones absolutas, como aislamiento y roles inmutables, no se eliminan
con una aprobacion; las acciones condicionadas a aprobacion estan separadas.


## Policies obligatorias

La v5 separa conocimiento de reglas duras. `knowledge/` contiene contexto y referencias blandas; `policies/` contiene reglas obligatorias que el verificador debe hacer cumplir. Los Domain Experts no duplican esas reglas: las referencian mediante `policies[]`.

Capas iniciales:

- `policies/architecture/design-patterns.md`
- `policies/architecture/configuration-governance.md`
- `policies/architecture/accounting-segmentation-engine.md`
- `policies/architecture/agnostic-engine-sovereignty.md`
- `policies/frontend/frontend-architecture.md`
- `policies/security/tenant-boundaries.md`
- `policies/testing/gates.md`
- `policies/context/context-order.md`
- `policies/context/route-conformance.md`
- `policies/approvals/approval-boundaries.md`

## Publicacion y consumo

Un cambio de manifest se revisa y se publica en Git con su revision. UBP consume
una revision fijada del protocolo y un catalogo aprobado, nunca el skill como
fuente de verdad. El pipeline de este repo ejecuta `npm run check`, que incluye el dictamen PO mediante `npm run audit:po`.

El gate de UBP debe validar su catalogo y comprobar referencias y frescura:
registrar revisiones/digests de protos, ADRs, endpoints y semillas; si cambia una
referencia relevante sin republicar el manifest, debe fallar el build. El
Governance Readiness Gate y la auditoría de seeds ya bloquean autoridad
incompleta o evidencia desalineada. La integración automática con el pipeline
de cada repositorio consumidor sigue pendiente; hasta entonces, aprobar el
schema demuestra estructura, no cobertura del código actual.

La clasificacion de intencion, el registro de aprobaciones y la ejecucion real
pertenecen al consumidor. Debe invocar el broker antes de recuperar contexto o
actuar y hacer cumplir su salida; el skill por si solo no garantiza enforcement.

## Compatibilidad v11

La v11 agrega una [constitución de producto UBP](protocol/ubp-product-constitution.md), el [protocolo de inteligencia de mercado](protocol/market-intelligence.md) y la política de [soberanía de motores agnósticos](policies/architecture/agnostic-engine-sovereignty.md). Cada experto debe declarar su mejor versión, resultados, invariantes, frontera de configuración, lecciones verificables de fuentes oficiales y gates reproducibles.


transition(previous, facts) conserva v1. El tercer argumento expertContext activa
el flujo de expertos y agrega primaryExpert y expertDecision al sobre, sin modificar el pack.
El schema v11 exige `knowledgeSources`, `semanticAnchors`, `northStar`,
`marketIntelligence`, `enforcement` y `policies` para que el experto no improvise
dirección de producto, conceptos de dominio, benchmarks ni evidencia.

La v10 agregó la capacidad `accounting-segmentation` y la policy
`policies/architecture/accounting-segmentation-engine.md`. Esta policy recupera y formaliza
el motor contable segmentado de UBP: la cuenta visible es un DisplayCode derivado; la verdad
primaria es cuenta natural mas segmentos tipados y configurables. Ledger gobierna el asiento,
Control Plane gobierna mascaras y vigencias, y los dominios operativos aportan hechos.
Ver el [contrato de entrada](protocol/domain-experts.md) antes de integrar.
El CLI historico valida ambos tipos de manifest; validate conserva el schema
de capacidad por defecto y validateManifest selecciona por kind. La validacion
es estructural y comprueba relaciones internas; no certifica cobertura contra
un catalogo UBP. No se incluyen logica contable ni un runtime de agentes.



## Deliberacion de dominios

La v8 agrega `protocol/domain-deliberation.md`. Cuando un `escalate` valido cruza dominios, participan solo los expertos impactados. Cada uno entrega postura, evidencia, riesgos, condiciones y bloqueos dentro de su autoridad. Architect consolida y Reviewer valida. No hay mayoria simple: el acuerdo permite avanzar, pero una restriccion dura con evidencia frena.

## Escalamiento con recomendacion

La v7 agrega `protocol/escalation-recommendations.md`. Un `escalate` sobre capacidad publicada no es un frenazo seco: el experto primario debe entregar conflicto, recomendacion, alternativas descartadas, firma requerida, dominios impactados, evidencia disponible/faltante, prohibiciones y pruebas. `block` sigue siendo duro para restricciones absolutas, hechos invalidos, aprobacion faltante o capacidad no publicada.


## Document Workflow Deliberation

La v9 agrega `protocol/document-workflow-deliberation.md`. Recepcion documental se gobierna como envelope con estados, responsables, aprobaciones, trazabilidad, visualizacion, autorizacion de pago y handoff contable. El flujo puede crear candidatos y borradores, pero no postea CxP ni mueve inventario directamente desde correo/webhook/OCR.

## Document Reception y AP Automation

La v6 agrega `ap` y `document-reception` como capacidades publicadas y `ap-expert` como experto de dominio. El flujo correo/webhook/OCR crea un envelope documental y candidatos estructurados; no crea una CxP posteada sin validacion, matching, workflow y handoff a Ledger/Inventory/Control Plane cuando aplique.
