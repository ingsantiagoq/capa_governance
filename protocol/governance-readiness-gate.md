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

## Soberanía ejecutable del motor

La autoridad del experto y la soberanía del motor son decisiones distintas. Un experto Tax puede estar vigente y aun así debe responder `BLOCK` a una apertura de país cuando UBP no demuestre la cadena técnica completa. `tools/engine-sovereignty-gate.mjs` evalúa esa segunda decisión con evidencia fijada a una sola revisión de UBP.

Tax debe demostrar publicación de recursos ejecutables en Control Plane, resolución única, integridad del manifiesto, pin inmutable por tenant y país, consumo efectivo por el motor, upgrade explícito, dos países sobre el mismo binario, un país ficticio que descarte switches conocidos, ausencia de fallback nacional en runtime y handoff contable trazable. Para marcar una etapa `PASS` exige ancla, comando, código de salida cero, digest del resultado, fecha de ejecución y revisión UBP coincidente. Documentos, porcentajes o pruebas generales sin esa trazabilidad no producen `READY`.

Todo artefacto con semántica nacional se clasifica como `country-pack-data`, `legal-adapter` o `universal-primitive`. Un artefacto sin clasificación y justificación bloquea. El adaptador legal solo es válido detrás de un contrato universal y un binding gobernado; no autoriza reglas fiscales nacionales dentro del núcleo.

```sh
node tools/engine-sovereignty-gate.mjs inventory/tax-sovereignty-evidence.json
```

La evidencia publicada representa el estado auditado, no una aspiración. Por eso el comando termina con código 1 mientras permanezca una brecha. Al cambiar UBP se regenera contra el commit nuevo; no se cambia un `BLOCK` a `PASS` sin ejecutar el comando y conservar el resultado correspondiente.
