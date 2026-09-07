# Architecture Policy · Design Patterns

Status: mandatory policy.

Use extensible patterns when behavior varies by tenant, country, capability, module, document type or channel.

Rules:

- Use Strategy for variable behavior; do not encode business variation in switch/if ladders.
- Use Factory when selecting implementations from policy, capability or runtime configuration.
- Use Builder when assembling complex request/response/domain objects in repeated flows.
- Use domain/application services for business orchestration; keep controllers and endpoints thin.
- Use Outbox/Saga for cross-service consistency; do not fake atomicity across services.
- Keep ownership explicit: each fact has one authoritative service.
- Do not introduce shared mutable business tables across domains without Architecture review.

Verifier cues:

- A new switch/if over country, tenant, customer, module, document type or capability requires Strategy/config justification.
- Repeated object assembly in endpoints or UI adapters requires Builder extraction or explicit exception.
- Cross-service write flows require outbox/saga or an approved blocking reason.
