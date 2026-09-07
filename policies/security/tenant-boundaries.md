# Security Policy · Tenant and Role Boundaries

Status: mandatory policy.

Rules:

- Tenant isolation is absolute.
- ADMIN and OWNER roles are immutable; do not mutate their permissions directly.
- Permission expansion must go through governed catalog/reconciliation.
- BFF remains the user-facing boundary.
- Service-to-service trust must be explicit and least-privilege.

Verifier cues:

- Cross-tenant reads/writes block.
- Direct ADMIN/OWNER permission mutations block.
- Permission expansion without approval and audit path blocks.
