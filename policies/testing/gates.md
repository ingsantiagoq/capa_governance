# Testing Policy · Gates

Status: mandatory policy.

Rules:

- Changes must include meaningful tests at the level of risk.
- CAPA/ADR claims must cite reproducible evidence.
- The walkthrough vendible must remain green before merge.
- Schema, manifest and broker changes must keep protocol tests green.
- Cross-domain changes require route conformance validation.

Verifier cues:

- Claims without command/evidence do not pass review.
- Manifest/schema changes without protocol tests block.
- UBP changes that break walkthrough block.
