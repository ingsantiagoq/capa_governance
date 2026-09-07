# Context Policy · Manifest First

Status: mandatory policy.

Order:

1. Domain Expert Manifest or Capability Manifest.
2. UBP ADR/CAPA references declared by the manifest.
3. Graphify expansion using declared seeds.
4. Source code only after manifest and graph are insufficient.

Rules:

- Do not search the repository freely before resolving intent, domain and manifest.
- Do not invent UBP capability existence from market references.
- Market lenses are comparison pressure only; they are not mandatory implementation requirements.
- If route is missing, ambiguous or stale, the broker must escalate or block.
