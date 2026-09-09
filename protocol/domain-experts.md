# Domain Experts v11

Regla: **one intent, one primary expert; escalate only on risk or cross-domain impact**.
Una intencion normalizada inicia un flujo y selecciona un experto primario por
su dominio y capacidad publicados. No hay votacion, fan-out ni framework de
agentes. El experto conserva la responsabilidad de la intencion durante el
handoff; Arquitecto, Reviewer, PO y Compliance reciben decisiones acotadas.
La falta o ambiguedad de experto es un riesgo de gobierno y exige escalamiento.

## Publicacion

El Domain Expert Manifest complementa al Capability Manifest; no lo reemplaza.
Su schema exige kind=domain-expert, version=11, id, domain, scope, coveredCapabilities, seedNodes, escalationTriggers, prohibitedActions, handoffTargets, retrieval, knowledgeSources, semanticAnchors, northStar, marketIntelligence, enforcement y policies. `northStar` expresa la mejor versión y sus invariantes; `marketIntelligence` conserva lecciones de fuentes oficiales con fecha de verificación; `enforcement` declara gates reproducibles y la condición de READY. Los identificadores son slugs exactos en minusculas.
El alcance describe responsabilidad; no autoriza operaciones de negocio.

Cada trigger declara un risk y sus targets, todos presentes en handoffTargets.
El trigger cross-domain-impact es obligatorio. Riesgos no publicados se escalan
a todos los handoffTargets del experto para revision del manifest. Las acciones
absolute nunca se habilitan con aprobacion; withoutApproval exige evidencia
para la accion concreta. Ambas listas son obligatorias y no vacias.
seedNodes debe coincidir con retrieval.seedNodes. El validador comprueba estas
relaciones ademas del schema y rechaza IDs duplicados dentro de cada tipo.

El ejemplo AR cubre facturas, notas credito, recibos, reversas, impacto Ledger,
cierre de periodo, facturacion electronica cuando aplique, frontera BFF,
aislamiento de tenant y decisiones PO/compliance. Sus semillas son anclas
logicas propuestas desde el alcance acordado; no se inspecciono codigo UBP.
Antes de usarlo en produccion, publicar una capacidad AR aprobada, verificar
cobertura, resolver semillas contra un indice fijado y revisar las politicas.
El catalogo de ejemplo no incluye un Capability Manifest AR verificado.

## Entrada y salida deterministas

La API v1 transition(previous, facts) conserva exactamente su contrato.
Para v11 llamar transition(previous, facts, expertContext). El tercer argumento
es obligatorio en consumidores v11; omitirlo elige explicitamente compatibilidad
v1. No utilizar esa omision para eludir un bloqueo v11.

```js
const expertContext = {
  domain: 'ar',
  capability: 'ar',
  action: 'inspect-invoice',
  impactedDomains: ['ar'],
  risks: [],
  approvedActions: [],
  experts: [arManifest]
};
const result = transition('block', verifiedCapabilityFacts, expertContext);
```

El consumidor normaliza la intencion contra capacidades publicadas y aporta:
- domain: dominio primario explicitamente resuelto; nunca inferido del orden.
- capability: ID de la capacidad resuelta por el router v1.
- action: identificador de la accion concreta propuesta.
- impactedDomains: todos los dominios afectados, incluido el primario.
- risks: riesgos pendientes verificados; una lista vacia requiere evaluacion.
- approvedActions: aprobaciones verificadas para esta tarea, tenant, accion,
  revision y alcance; no reutilizar aprobaciones de otra intencion.
- experts: catalogo aprobado en una revision fijada, validado por el broker.

La referencia no clasifica lenguaje natural ni autentica hechos. El consumidor
debe vincular capability con el manifest que produjo facts y comprobar que la
clasificacion no omite riesgos, impactos o acciones prohibidas. Una accion que
no figura como prohibida sigue sujeta a las politicas y permisos de capacidad.

Prioridades:
1. Un block v1 prevalece, incluso capacidad ausente o invalida.
2. Entrada o catalogo de expertos invalido: block/invalid-expert-facts.
3. Cero expertos coincidentes: escalate/missing-expert. Varios:
   escalate/ambiguous-expert. primaryExpert=null; target architect, rol de
   gobierno definido por el protocolo, no un experto fabricado.
4. Un experto coincide exactamente por domain y coveredCapabilities.
   Restriccion absoluta o aprobacion especifica ausente: block.
5. Cualquier dominio adicional agrega cross-domain-impact. Cualquier riesgo
   pendiente produce escalate con targets publicados, unicos y ordenados.
   AR + Ledger entrega a architect y reviewer y conserva ar-expert primario.
6. Sin riesgos pendientes, conservar decision/gates y recuperacion v1, usando
   el menor presupuesto de expansion entre capacidad y experto. Un escalate
   v1 usa los handoffTargets del experto; ready nunca ejecuta una operacion.

La salida agrega primaryExpert (ID o null) y expertDecision ({status, targets})
en el sobre de ejecucion. status registra seleccion, handoff o motivo del
bloqueo; state/action/reason siguen siendo la decision autoritativa del broker.
El Context Pack mantiene sus siete campos. Registrar por separado revision de
ambos manifests, intencion, evidencia, aprobaciones y resultado.

Un handoff debe incluir intencion, primario, dominios afectados, riesgo,
decision solicitada, evidencia y rol responsable. Al resolverlo, el consumidor
aporta hechos nuevos verificables y reevalua. Un cruce de dominios persistente
sigue escalando: esta referencia no modela un token de aprobacion de handoff
ni permite borrar impactos reales para forzar ready. La ejecucion posterior
al handoff pertenece al flujo gobernado del consumidor.

Manifest-first publica conocimiento; Graphify expande solo semillas curadas;
fuente/codigo es ultimo recurso. El skill solo lee el protocolo e inicia este
flujo. El registro y el Governance Readiness Gate controlan identidad, revisión, digest y frescura. La automatización dentro del pipeline de cada consumidor se implementa en ese repositorio y debe fallar cerrado.
