---
name: ubp-context-broker
description: Inicializa el protocolo CAPA Governance al iniciar una tarea sobre UBP, resolviendo capacidades y expertos publicados y aplicando el Context Broker v2.
---

Usar el catalogo UBP aprobado y la revision fijada de capa_governance. Este skill
es un adaptador, no una fuente de verdad ni un permiso para ejecutar acciones.

1. Leer [protocolo de expertos](../../protocol/domain-experts.md) y
   [router](../../protocol/capability-router.md), resolver la intencion contra
   manifests y validarlos con tools/validate-capability-manifests.mjs del repo.
   Sin catalogo o coincidencia: block. Con ambiguedad: escalate al PO.
2. Resolver dominio, capacidad, accion, impactos y riesgos verificados para
   expertContext; usar un experto primario publicado. Ausencia o ambiguedad de
   experto escala a Arquitecto; no inventar experto ni iniciar agentes paralelos.
   Producir el [Context Pack](../../protocol/context-pack.md) de siete campos;
   conservar politicas y registrar revision e intencion en el sobre de ejecucion.
3. Aplicar [broker](../../protocol/context-broker-state-machine.md) con hechos
   verificados usando transition(previous, facts, expertContext) de
   tools/context-broker.mjs. No omitir expertContext para evadir v2. No inventar aprobaciones ni
   considerar suficiente un pack solo porque tiene siete campos.
4. ready: continuar dentro de alcance. expand/graphify: expandir solo semillas
   curadas, registrar intento y presupuesto, reevaluar. expand/source: abrir solo
   evidencia focalizada cuando manifest y grafo resultan insuficientes.
5. escalate: entregar brecha o decision a expertDecision.targets con evidencia
   y conservar primaryExpert en el sobre. block: informar motivo
   y requisito faltante. No ejecutar la accion pendiente en ninguno de ellos.

No sustituir manifests con memoria, buscar libremente en Graphify ni leer el
repo completo. Si el broker o sus recursos no estan disponibles, informar el
bloqueo; no simular que el protocolo fue validado. Conservar esta estructura de
repo al distribuir el skill para que sus referencias relativas sigan funcionando.
