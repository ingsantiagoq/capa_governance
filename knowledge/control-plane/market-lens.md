# Control Plane Market Lens for UBP

Date: 2026-09-07
Status: curated comparison seed for `control-plane-expert`; not a runtime catalog.

This lens keeps market knowledge separate from UBP truth. UBP facts come from ADR-0006, ADR-0003, ADR-0005, ADR-0082, the control-plane capability manifest, Graphify and source code. Market references shape configuration governance, not implementation claims.

## Comparison matrix

| Axis | UBP context | SAP pressure | Dynamics pressure | Oracle pressure | Odoo pressure | UBP direction |
|---|---|---|---|---|---|---|
| Capability governance | Capabilities, plans, dependencies and permissions are governed centrally. | Customizing and role/catalog setup separate configuration from transactions. | Feature management and security roles gate behavior. | Enterprise setup controls modules, ledgers, roles and flexfields. | Apps/modules, groups and settings activate behavior. | Keep capability activation catalog-driven and audited. |
| Tenant policy | Runtime config should be tenant/plan/country aware without customer forks. | Configuration drives country/org behavior. | Legal entities and features configure process variants. | Setups and ledgers define enterprise behavior. | Company settings and app configuration shape modules. | Config no código; policy belongs in Control Plane. |
| Permission model | ADMIN and OWNER are immutable; role expansion requires governed reconciliation. | Privileged roles follow controlled lifecycle. | Security roles/duties/privileges constrain access. | Roles and data security policies guard operations. | Groups and access rules gate models/actions. | Never mutate privileged roles directly; reconcile through canonical catalog. |
| Cost center policy | Control Plane decides enablement/default policy, not accounting meaning. | Cost center/profit center config is central and consumed by finance. | Financial dimensions are configured centrally and consumed across modules. | Flexfields/segments are governed enterprise dimensions. | Analytic plans/accounts are configured and consumed by accounting. | Configure whether cost center is required/defaulted; Ledger owns accounting consequences. |
| Provisioning | Enablement may seed defaults through idempotent hooks. | Setup/provisioning prevents half-configured modules. | Feature and entity setup precede transactions. | Implementation setup seeds chart, roles and ledgers. | Module installation and settings seed defaults. | Cross-service provisioning changes escalate to architect/reviewer. |

## Semantic anchors

- `capability`: governed business ability enabled for tenant or plan.
- `policy`: runtime behavior controlled by config, not code fork.
- `role-template`: canonical permissions bundle with immutable privileged roles.
- `cost-center`: configured requirement/default whose accounting meaning belongs to Ledger.
- `provisioning`: idempotent setup hook with audit trail.

## Expert decision policy

The Control Plane expert can answer directly on non-mutating configuration interpretation, capability dependencies, role-template semantics and policy placement.

The Control Plane expert escalates when a change expands permissions, changes privileged roles, activates capabilities in production, changes cost-center policy, adds provisioning hooks, crosses services, changes migrations or affects tenant isolation.
