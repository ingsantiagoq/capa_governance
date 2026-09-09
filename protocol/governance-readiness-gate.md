# Governance Readiness Gate v1

## Decisión

El gate responde únicamente `READY` o `BLOCK`. `READY` significa que CAPA tiene evidencia suficiente para iniciar el flujo normal del Context Broker. No autoriza ejecutar la operación, omitir aprobaciones ni relajar políticas. `BLOCK` impide avanzar hasta corregir todas las razones reportadas.

El gate evalúa una intención normalizada con `domain`, `capability`, `action` e `impactedDomains` contra un catálogo fijado. No interpreta lenguaje natural ni presume evidencia ausente.

## Condiciones acumulativas para READY

1. El Registry, los Domain Expert Manifests y los Capability Manifests son estructuralmente válidos y no contienen IDs duplicados.
2. Existe exactamente un experto cuyo `domain` y `coveredCapabilities` coinciden con la intención.
3. Existe exactamente un Capability Manifest para la capacidad solicitada.
4. El experto primario está `active` y tiene dueño, suplente distinto, aprobador, revisión aprobada, digest del manifiesto y vencimiento de revisión.
5. El digest registrado coincide con el contenido canónico del manifiesto evaluado.
6. El índice Graphify y la verificación de semillas declaran como fuente el mismo commit de UBP.
7. La atestación de semillas coincide con las semillas del manifiesto y la revisión del grafo.
8. La revisión no está vencida y la acción no figura en `blockedActions`.
9. Cada dominio impactado tiene exactamente un experto activo con la misma evidencia vigente.

Todas las condiciones son necesarias. Una sola falla produce `BLOCK`; no existe aprobación implícita ni degradación silenciosa.

## Evidencia y límites

`manifestSha256` detecta cambios posteriores a la aprobación. `seedVerificationSha256` vincula la lista de semillas con el commit declarado en `seedGraphRevision`. El consumidor que genera esa atestación debe resolver antes todas las semillas en Graphify; el hash por sí solo no demuestra que la consulta ocurrió.

La herramienta de referencia `tools/audit-expert-seeds.mjs` solo emite esa atestación cuando cada semilla resuelve a un nodo único. Coincidencias ambiguas y ausencias producen `BLOCK` y código de salida `1`.

`approvedRevision` registra la revisión Git donde la autoridad competente aprobó el manifiesto. No se compara con el HEAD completo porque un cambio independiente en Governance no debe invalidar manifests que conservan el mismo digest.

`reviewDueAt` establece una caducidad explícita. Un experto vencido se bloquea aunque su manifiesto siga validando estructuralmente.

Los expertos `candidate`, `suspended` o `retired` permanecen visibles en el inventario, pero nunca permiten avanzar.

## Relación con el Context Broker

```text
intención normalizada
  -> Governance Readiness Gate
     -> BLOCK: corregir catálogo/evidencia
     -> READY: Context Broker
        -> ready | expand | escalate | block
```

El Readiness Gate prueba que existe autoridad y conocimiento vigente. El Context Broker decide después si el contexto basta, si debe consultar Graphify/código, si hay riesgo, si falta aprobación o si una política prohíbe la acción.

## Uso de referencia

```sh
node tools/governance-readiness-gate.mjs evidence-bundle.json
```

El proceso termina con código `0` para `READY` y `1` para `BLOCK` o entrada inválida. El bundle contiene `registry`, `expertManifests`, `capabilityManifests`, `request` y `evaluatedAt`.
