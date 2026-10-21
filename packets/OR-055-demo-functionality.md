# OR-055 — Demo functionality repair

Authorized by the owner on 2026-10-21: implement the functionality audit, document
the work, and add an exhaustive regression review. Codex owns this branch.

## Scope

Repair sending order, stale recipient content, retry safety, missed schedules,
complaint enforcement, review navigation and Undo integrity, optional contact email,
import mapping/dates/phones, hidden bulk selections, eligibility and empty states,
fixture MLS features, and usable demo billing/text/auth workflows.

Preserve the approved OR-054 marketing design and truthful claims. Keep fixture
providers and all real delivery gates closed. No remote database writes, live
provider integration, deployment, or merge. Necessary schema changes must ship
with generated migrations and be tested against an isolated scratch database.

## Review requirements

- Reproduce each failure with a behavior test before accepting its fix.
- Cover adversarial inputs, ownership, stale state, repeated requests, concurrency,
  uncertain delivery, and recovery paths, not just the happy path.
- Run full verification and browser checks against scratch data; report omissions.
- Review the final diff against this checklist, including copy and access rules.
- Keep a finding-by-finding work log in docs/audits/OR-055-functionality.md.
