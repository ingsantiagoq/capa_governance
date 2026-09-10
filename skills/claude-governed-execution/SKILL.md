---
name: claude-governed-execution
description: Ejecuta trabajo CAPA Governance con objetivo claro, goal persistente, agentes, Graphify y revisión par obligatoria.
---

# Claude governed execution

Lea `protocol/claude-governed-execution.md` y `inventory/claude-execution-policy.json`.

Antes de editar:

1. invoque `/ultraplan`; si no existe, aclare el objetivo y use el fallback publicado;
2. invoque `/goal`;
3. actualice y consulte Graphify;
4. invoque `/agent` y registre asignaciones;
5. cree `.capa/claude-execution-attestation.json` y obtenga `READY_TO_START`.

Antes de cerrar:

1. complete agentes y evidencia;
2. regenere y consulte Graphify;
3. invoque `/ultrareviewer` sobre todo el alcance;
4. resuelva sus hallazgos;
5. complete `/goal` y obtenga `COMPLETE`.

No fabrique recibos, hashes, consultas ni resultados. Ante ausencia de evidencia, conserve `BLOCK`.
