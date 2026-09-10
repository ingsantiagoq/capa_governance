#!/usr/bin/env bash
set -uo pipefail

input=$(cat)
root="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
attestation="$root/.capa/claude-execution-attestation.json"
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')
command=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')
head_revision=$(git -C "$root" rev-parse HEAD 2>/dev/null || true)

# The attestation itself is the bootstrap surface and must remain writable.
if [ -n "$file" ] && { [ "$file" = "$attestation" ] || [ "$file" = ".capa/claude-execution-attestation.json" ]; }; then
  exit 0
fi

# Permit only the exact directory bootstrap needed before the attestation exists.
if [ ! -f "$attestation" ] && printf '%s' "$command" | grep -Eq '^mkdir[[:space:]]+-p[[:space:]]+("?\.capa"?|"?[^;&|]*/\.capa"?)[[:space:]]*$'; then
  exit 0
fi

require_start_gate() {
  if [ ! -f "$attestation" ]; then
    printf 'CAPA Governance bloqueó la mutación: falta %s. Ejecute /ultraplan (o aclare el objetivo), /goal, Graphify y /agent; luego registre la atestación de inicio.\n' "$attestation" >&2
    exit 2
  fi
  base_revision=$(jq -r '.repository.baseRevision // empty' "$attestation")
  if [ -z "$head_revision" ] || [ "$base_revision" != "$head_revision" ]; then
    printf 'CAPA Governance bloqueó la mutación: la atestación parte de %s pero HEAD es %s. Cree una atestación para esta tarea.\n' "$base_revision" "$head_revision" >&2
    exit 2
  fi
  if ! out=$(cd "$root" && node tools/claude-execution-gate.mjs "$attestation" 2>&1); then
    printf 'CAPA Governance bloqueó la mutación:\n%s\n' "$out" >&2
    exit 2
  fi
}

if [ -n "$file" ]; then
  require_start_gate
fi

if [ -n "$command" ] && printf '%s' "$command" | grep -Eq '(^|[;&|[:space:]])(cat[^;&|]*>|cp|mv|rm|touch|mkdir|sed[[:space:]]+-i|python[0-9.]*[^;&|]*(write|unlink|rmtree)|node[^;&|]*(writeFile|unlink|rmSync))([[:space:]]|$)'; then
  require_start_gate
fi

if printf '%s' "$command" | grep -Eq '(^|[;&|[:space:]])git([^;&|]*)[[:space:]]commit([[:space:]]|$)'; then
  if [ ! -f "$attestation" ] || [ "$(jq -r '.phase // empty' "$attestation")" != "complete" ]; then
    printf 'CAPA Governance bloqueó el cierre: la atestación debe estar en phase=complete después de Graphify final y /ultrareviewer.\n' >&2
    exit 2
  fi
  require_start_gate
  if ! out=$(cd "$root" && node tools/claude-execution-gate.mjs "$attestation" 2>&1); then
    printf 'CAPA Governance bloqueó el cierre:\n%s\n' "$out" >&2
    exit 2
  fi
fi

if printf '%s' "$command" | grep -Eq '(^|[;&|[:space:]])git([^;&|]*)[[:space:]]push([[:space:]]|$)'; then
  if [ ! -f "$attestation" ] || [ "$(jq -r '.phase // empty' "$attestation")" != "complete" ] ||
     [ "$(jq -r '.repository.resultRevision // empty' "$attestation")" != "$head_revision" ]; then
    printf 'CAPA Governance bloqueó el push: phase debe ser complete y repository.resultRevision debe coincidir con HEAD=%s.\n' "$head_revision" >&2
    exit 2
  fi
  if ! out=$(cd "$root" && node tools/claude-execution-gate.mjs "$attestation" 2>&1); then
    printf 'CAPA Governance bloqueó el push:\n%s\n' "$out" >&2
    exit 2
  fi
fi

exit 0
