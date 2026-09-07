# CAPA Governance v6

El conocimiento se publica, no se busca.

CAPA Governance es el protocolo de conocimiento gobernado por encima de UBP
(Unified Business Platform). Define como resolver una capacidad, entregar su
contexto minimo y decidir si alcanza para una tarea. UBP conserva la ejecucion
y la logica de negocio. Este repositorio central contiene especificacion,
ejemplos y funciones de referencia pequenas; no es un framework de agentes.

Los Capability Manifests y Domain Expert Manifests versionados son la fuente
oficial. En v6, los expertos de dominio declaran fuentes UBP y fuentes de mercado
explicitas para anclar semantica sin convertir benchmarks en verdad implementada. Una intencion tiene un experto primario; solo se escala por riesgo o
impacto entre dominios. El Context Pack conserva
sus siete campos. El Capability Router aplica manifest-first, graphify-second,
source-last. El Context Broker produce ready, expand, escalate o block mediante
una funcion pura testeable. El skill solo adapta el protocolo a una conversacion;
no publica conocimiento ni reemplaza gates o permisos.

## Ejecutar

Requiere Node >=22, sin dependencias externas ni npm install:

```sh
npm run check
node tools/validate-capability-manifests.mjs examples/*.manifest.json
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

- [Capability schema](schemas/capability-manifest.schema.json): contrato v1 cerrado.
- [Expert schema](schemas/domain-expert-manifest.schema.json) y
  [protocolo de expertos](protocol/domain-experts.md): seleccion determinista; contrato de conocimiento v6.
- [Experto AR](examples/ar.expert.manifest.json): cuentas por cobrar y gates;
  anclas propuestas pendientes de verificar contra UBP.
- [Experto Inventario](examples/inventory.expert.manifest.json): dominio concreto derivado de ADR-0021 y CAPAs de inventario;
  separa verdad UBP, lentes de mercado, limites de dominio y escalamiento.
- [Experto Ledger](examples/ledger.expert.manifest.json): gobierno contable, dimensiones, centros de costo, periodos y posteo.
- [Experto Control Plane](examples/control-plane.expert.manifest.json): capabilities, permisos, configuracion por tenant y politicas runtime.
- [Inventory Market Lens](knowledge/inventory/market-lens.md): comparacion curada contra SAP, Dynamics, Epicor y Odoo;
  funciona como presion de diseno, no como prueba de implementacion UBP.
- [Ledger Market Lens](knowledge/ledger/market-lens.md): comparacion curada para asientos, dimensiones, centros de costo, periodos y account maps.
- [Control Plane Market Lens](knowledge/control-plane/market-lens.md): comparacion curada para capabilities, permisos, politicas por tenant y provisioning.
- [Context Pack](protocol/context-pack.md): siete campos y procedencia.
- [Broker](protocol/context-broker-state-machine.md): prioridades y transiciones.
- [Router](protocol/capability-router.md): resolucion de intencion y recuperacion.
- [Inventory](examples/inventory.manifest.json),
  [Ledger](examples/ledger.manifest.json),
  [Cost Center](examples/cost-center.manifest.json) y
  [Control Plane](examples/control-plane.manifest.json): ejemplos de las pruebas
  de contexto UBP del 2026-09-07; no son un catalogo de produccion aprobado.
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
- `policies/frontend/frontend-architecture.md`
- `policies/security/tenant-boundaries.md`
- `policies/testing/gates.md`
- `policies/context/context-order.md`
- `policies/context/route-conformance.md`
- `policies/approvals/approval-boundaries.md`

## Publicacion y consumo

Un cambio de manifest se revisa y se publica en Git con su revision. UBP consume
una revision fijada del protocolo y un catalogo aprobado, nunca el skill como
fuente de verdad. El pipeline de este repo ejecuta npm run check.

El gate de UBP debe validar su catalogo y comprobar referencias y frescura:
registrar revisiones/digests de protos, ADRs, endpoints y semillas; si cambia una
referencia relevante sin republicar el manifest, debe fallar el build. Ese gate
cross-repo y la integracion Graphify no estan implementados en esta v2. Aprobar
el schema demuestra estructura, no que el conocimiento refleje el codigo actual.

La clasificacion de intencion, el registro de aprobaciones y la ejecucion real
pertenecen al consumidor. Debe invocar el broker antes de recuperar contexto o
actuar y hacer cumplir su salida; el skill por si solo no garantiza enforcement.

## Compatibilidad v6

transition(previous, facts) conserva v1. El tercer argumento expertContext activa
el flujo de expertos y agrega primaryExpert y expertDecision al sobre, sin modificar el pack.
El schema v6 exige knowledgeSources, semanticAnchors y policies para que el experto no improvise
conceptos de dominio ni benchmarks de mercado.
Ver el [contrato de entrada](protocol/domain-experts.md) antes de integrar.
El CLI historico valida ambos tipos de manifest; validate conserva el schema
de capacidad por defecto y validateManifest selecciona por kind. La validacion
es estructural y comprueba relaciones internas; no certifica cobertura contra
un catalogo UBP. No se incluyen logica contable ni un runtime de agentes.

## Document Reception y AP Automation

La v6 agrega `ap` y `document-reception` como capacidades publicadas y `ap-expert` como experto de dominio. El flujo correo/webhook/OCR crea un envelope documental y candidatos estructurados; no crea una CxP posteada sin validacion, matching, workflow y handoff a Ledger/Inventory/Control Plane cuando aplique.
