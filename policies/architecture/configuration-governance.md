# Architecture Policy · Configuration Governance

Status: mandatory policy.

Rules:

- Configuration precedes hardcoded behavior.
- Do not hardcode country, customer, tax, account, permission, branch, cost center, plan or feature behavior when it can be expressed as governed configuration.
- Use Control Plane for runtime policy, capabilities, plans, permissions, defaults, feature flags and provisioning.
- Use domain services for authoritative facts; use Control Plane for policy that changes behavior.
- No customer fork. Capabilities and configuration handle variation.

Verifier cues:

- `if country`, customer-specific branches, fixed account codes, fixed tax logic or fixed permissions block unless an ADR explicitly accepts the exception.
- Tenant-specific behavior must cite capability/config source and audit path.
