# Ejecución gobernada para Claude Code

CAPA Governance exige una secuencia verificable para que Claude convierta una necesidad en trabajo terminado sin improvisar alcance, abandonar el plan, serializar trabajo independiente ni aprobar su propia implementación.

## Secuencia

1. **Objetivo claro.** `/ultraplan` produce objetivo, criterios de aceptación y workstreams. Cuando no esté disponible, se permite aclarar el objetivo primero y registrar `objective-clarification-fallback`. La ausencia del comando no permite comenzar con alcance ambiguo.
2. **Persistencia.** `/goal` registra el objetivo antes de implementar y permanece activo durante todo el recorrido.
3. **Orientación por grafo.** Graphify actualiza el índice, consulta símbolos y dependencias, y registra anclas antes de leer o cambiar el código objetivo.
4. **Ejecución distribuida.** `/agent` asigna los workstreams independientes. Las dependencias se respetan; la concurrencia no autoriza ediciones sobre la misma superficie.
5. **Verificación del índice.** Graphify se actualiza después de implementar y confirma que las anclas finales existen.
6. **Revisión par.** `/ultrareviewer` revisa el resultado completo, incluidas pruebas, arquitectura, seguridad, documentación y calidad del índice. Cualquier hallazgo sin resolver bloquea.
7. **Cierre.** `/goal` termina después de evidencia reproducible y revisión aprobada.

## Atestación

Cada ejecución conserva `.capa/claude-execution-attestation.json`, archivo local ignorado por Git. Debe registrar recibos de las cuatro skills, revisión base del repositorio, tiempos ordenados, agentes autores, hashes del índice Graphify, consultas, anclas, revisor independiente y comandos de evidencia. La revisión no pasa cuando `reviewerId` coincide con un `workerId`.

El gate admite dos fases:

- `start` devuelve `READY_TO_START` y habilita ediciones.
- `complete` devuelve `COMPLETE` y habilita commit o push.

Antes del commit, `repository.baseRevision` debe coincidir con `HEAD`. Después del commit, Claude actualiza `repository.resultRevision` con el nuevo `HEAD`; el hook exige esa coincidencia antes del push. Esto impide reutilizar una atestación de otra tarea.

```sh
node tools/claude-execution-gate.mjs .capa/claude-execution-attestation.json
```

El archivo de ejemplo demuestra la forma del contrato; sus recibos y hashes no constituyen evidencia para una tarea real.
