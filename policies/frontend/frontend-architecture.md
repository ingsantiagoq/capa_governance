# Frontend Policy · Architecture and Reuse

Status: mandatory policy.

Rules:

- Frontend talks only to BFF surfaces; never directly to domain microservices.
- Do not duplicate CSS, design tokens, primitives, pipes, form patterns or API models.
- Use shared components for repeated controls and layouts.
- Forms must be extensible by metadata/configuration when fields vary by capability, tenant, country or module.
- Do not place business rules in UI when they belong to BFF/domain services.
- Keep numerical and currency formatting through UBP primitives, not ad hoc pipes or native number inputs.

Verifier cues:

- New duplicated SCSS/token patterns block.
- Native controls or formatting that bypass UBP primitives block when covered by existing lint rules.
- Domain service URLs in frontend block.
- New forms without reuse/extensibility rationale escalate to frontend reviewer.
