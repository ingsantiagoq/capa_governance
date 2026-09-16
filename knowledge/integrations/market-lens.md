# Integrations market lens

Verified 2026-09-16. Comparison material does not prove UBP implementation or provider support.

## Epicor

Official Kinetic material describes a versioned, OData-oriented REST API that exposes business objects,
processes, reports, BAQs and functions. Authentication and the available surface can vary by version and
installation.

UBP decision: expose provider-neutral contracts and isolate Epicor 9 and 10 behind separate adapters. A
version is supported only after native connection and operation evidence against a real installation. BAQ,
direct SQL, table access and screen automation are not silent fallbacks.

## Design pressure

- Connections and credentials are tenant-owned configuration.
- Provider/version translation belongs to adapters, not business domains.
- Every flow declares direction, system of record, mapping, idempotency, checkpoint and conflict policy.
- Domain services remain the only writers of UBP business facts.
- Initial bootstrap and continuous synchronization are different flows with separate readiness evidence.
