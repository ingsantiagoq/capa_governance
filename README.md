# CAPA Governance v1

El conocimiento se publica, no se busca.

CAPA Governance es el protocolo de conocimiento gobernado por encima de UBP
(Unified Business Platform). Define como resolver una capacidad, entregar su
contexto minimo y decidir si alcanza para una tarea. UBP conserva la ejecucion
y la logica de negocio. Este repositorio central contiene especificacion,
ejemplos y funciones de referencia pequenas; no es un framework de agentes.

El Capability Manifest versionado es la fuente oficial. El Context Pack conserva
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

Implementa exclusivamente los keywords del schema incluido (JSON Schema
2020-12), rechazando keywords desconocidos al cargarlo. No es un motor JSON
Schema general. Al ampliar el schema, ampliar y probar el validador o adoptar
una implementacion completa. No valida existencia de nodos, frescura ni permisos.

## Contenido

- [Schema](schemas/capability-manifest.schema.json): contrato v1 cerrado.
- [Context Pack](protocol/context-pack.md): siete campos y procedencia.
- [Broker](protocol/context-broker-state-machine.md): prioridades y transiciones.
- [Router](protocol/capability-router.md): resolucion de intencion y recuperacion.
- [Inventory](examples/inventory.manifest.json) y
  [Control Plane](examples/control-plane.manifest.json): ejemplos de las pruebas
  de contexto UBP del 2026-09-07; no son un catalogo de produccion aprobado.
- [Adaptador](skills/ubp-context-broker/SKILL.md): arranque de tareas UBP.
- tools/: validador y broker puro; test/: casos positivos, negativos y transiciones.

Las semillas son referencias logicas curadas a ADRs, contratos y simbolos de las
pruebas anteriores. Deben resolverse sin ambiguedad contra el indice fijado del
consumidor antes de usarse. No se inventan IDs Graphify ni rutas de archivos.
Las restricciones absolutas, como aislamiento y roles inmutables, no se eliminan
con una aprobacion; las acciones condicionadas a aprobacion estan separadas.

## Publicacion y consumo

Un cambio de manifest se revisa y se publica en Git con su revision. UBP consume
una revision fijada del protocolo y un catalogo aprobado, nunca el skill como
fuente de verdad. El pipeline de este repo ejecuta npm run check.

El gate de UBP debe validar su catalogo y comprobar referencias y frescura:
registrar revisiones/digests de protos, ADRs, endpoints y semillas; si cambia una
referencia relevante sin republicar el manifest, debe fallar el build. Ese gate
cross-repo y la integracion Graphify no estan implementados en esta v1. Aprobar
el schema demuestra estructura, no que el conocimiento refleje el codigo actual.

La clasificacion de intencion, el registro de aprobaciones y la ejecucion real
pertenecen al consumidor. Debe invocar el broker antes de recuperar contexto o
actuar y hacer cumplir su salida; el skill por si solo no garantiza enforcement.
