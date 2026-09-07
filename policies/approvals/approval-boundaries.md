# Approval Policy · Boundaries

Status: mandatory policy.

Rules:

- Santiago as PO approves merges to main, accepted ADRs, commercial decisions, compliance decisions and scope changes.
- Production deploys, real financial postings, real stock adjustments, migrations and permission/capability expansion require explicit approval.
- Absolute restrictions cannot be overridden by approval.
- Approval is action-scoped; approval for one action does not authorize adjacent actions.

Verifier cues:

- Missing approval for a protected action blocks.
- Broad approval claims without action scope block.
