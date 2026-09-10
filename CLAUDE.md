# CAPA Governance — ejecución obligatoria con Claude Code

Antes de modificar archivos, toda tarea debe cumplir `protocol/claude-governed-execution.md` y crear `.capa/claude-execution-attestation.json` a partir del ejemplo publicado.

Secuencia obligatoria:

1. `/ultraplan` define objetivo, criterios y workstreams. Si el comando no está disponible, solo se admite `objective-clarification-fallback`; no se modifica código hasta que el objetivo esté claro.
2. `/goal` registra el objetivo y permanece activo hasta completar toda la evidencia.
3. Graphify se actualiza y consulta antes de implementar; las anclas usadas se registran.
4. `/agent` distribuye los workstreams. Si las dependencias impiden concurrencia, conserva un solo workstream y registra esa decisión.
5. Se implementa y valida el alcance.
6. Graphify se actualiza otra vez para verificar el índice final.
7. `/ultrareviewer` revisa código, pruebas, documentación, seguridad, arquitectura y grafo. Todo hallazgo debe resolverse o bloquear el cierre.
8. `/goal` se marca completo únicamente después de que el gate devuelva `COMPLETE`.

Comandos de control:

```sh
node tools/claude-execution-gate.mjs .capa/claude-execution-attestation.json
npm run check
```

Los hooks del repositorio bloquean ediciones sin una atestación de inicio válida y bloquean `git commit`/`git push` sin cierre completo.
