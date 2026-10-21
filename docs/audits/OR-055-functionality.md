# OR-055 — Functionality repairs and self-review

Authorized by the owner on 2026-10-21. Base: merged OR-054, `775f7d0`.
Codex owns `codex/demo-functionality`. Preserve the approved marketing design.

## Finding-by-finding implementation

| Audit finding | Implemented repair |
|---|---|
| Send finishes before composition | Atomic composition, serialized across DB connections. Send requires ready state; waiting jobs consume no attempts. Interrupted composition rolls back the entire batch. |
| Edits redirect stale personalized content | Store an identity/house fingerprint; hold edited recipients. Admin can recompose changed, never-attempted content while preserving sent and uncertain deliveries. |
| Uncertain delivery duplicates mail | Durable claims precede provider calls. Explicit refusals can retry; uncertain outcomes and abandoned claims require provider reconciliation. Metadata is not treated as provider idempotency. |
| Missed scheduling day | Recover the most recent due occurrence after account creation, without a backlog of old months. Keep skipped/completed sends authoritative and call lists available during pauses. |
| Backoff defeats enqueue deduplication | Immutable enqueued_for defines job identity; retries change only run_after. Migration backfills existing identities before replacing the unique index. |
| Complaint pause only runs afterward | Evaluate complaints before delivery; re-read pause and billing state for each recipient. Preserve existing consent and threshold rules. |
| Mid-queue start finishes early | Rotate the queue around the requested person; reset the index after removal. |
| Final decision loses Undo | Render completion and five-second Undo together; restore the person and left-out count. |
| Browser can forge Undo snapshots | Account-bound, expiring signed proofs; state validation under a row lock; monotonic review version blocks replay even after another identical decision. |
| Missing review target opens someone else | Explicit missing target returns not-found. |
| Email-less MLS contact cannot be edited | Optional email stores null; malformed nonempty email still fails. Notes has a stable accessible name after reload. |
| Incomplete/duplicate import mapping | Require house location and unique, non-conflicting roles. Mapping stays editable; incomplete Import is disabled. |
| Impossible dates | Shared calendar validation, including leap years and year zero. Report supplied invalid dates as skipped rows. |
| CSV phone ignored | Phone aliases, mapping, server validation and normalized storage reuse the existing phone utility. |
| Hidden bulk selection | Actions, names and export derive from visible selected rows. |
| Incorrect eligible count/preview | One email-present, subscribed, matched, globally unsuppressed set supplies both. |
| All calls dismissed leaves blank panel | Explain completed names or a quiet month. |
| Address-update reassurance is false | Explain that notes pause until the new address is matched; preserve subscription consent. |
| Add-on charge disconnected from subscription | Synchronize paid switches with the next renewal, serialized per account. Include enabled extras in checkout; show provider recurring total in Billing. |
| Demo checkout and cancellation incomplete | Local/demo checkout activates a persistent test plan. Cancel/resume and recurring amount survive gateway restarts; checkout replay cannot uncancel an active plan. |
| Demo verification requires Twilio | Guarded demo mode uses a nonbillable fake and displays the generated code. Real validation, expiry and attempt checks remain active. |
| Temporary text failure consumes monthly claim | Atomically reclaim explicit temporary refusals and retry through a separate job. Never automatically resend accepted, permanent or uncertain outcomes. |
| Real digest never gets stored MLS | Load an actual active, recent nearby listing with provenance. Check ZIP, street, direction, street type and distance. Exclude future listings; keep rendering pure. |
| Own-home-listed signal missing | Highest-priority own-house signal plus separate nearby-listing signal. Store a real listing FK and render MLS attribution. |
| Password recovery missing | Local demo inbox exercises expiring, single-use reset links. Password reset increments authVersion and revokes old sessions. Public environments never disclose reset credentials. |
| Windows failures obscure real failures | Correct URL-to-path conversion, path normalization and seed invocation without weakening content/access/contrast checks. Explicit environment variables take precedence over env files so scratch tests cannot be redirected. |

## Executable self-review

`scripts/audit-self-review.mjs` requires an explicitly selected local database.
It runs green baselines, then deliberately breaks nine protections: composition
ordering, recipient identity, uncertain delivery, proof signatures, calendar
dates, import mapping, future MLS dates, spent Undo replay, and text retries.

Each probe must fail an assertion in its intended behavior test. Syntax, type
and import errors do not count. Finally restores the exact original file bytes;
the script never resets files to Git HEAD. JSON evidence is saved in the temporary
directory printed by the runner. CI runs this proof after full verification.

Additional DB tests exercise independent connections, competing workers, interrupted
composition, missing consent, complaint thresholds, stale edits, cross-account
Undo, durable cancellation, checkout replay, password replay and session versions.

`e2e/audit-functionality.spec.ts` exercises real forms at 390px and 1440px:
signup/checkout, phone verification, paid switches and billing totals,
cancel/resume, import/edit/reload, hidden selections, starting at the last review
item, final Undo, password reset and rejection of an old session. These run beside
the existing screen, overflow, contrast and tap-target suite.

## Required verification

- Full pnpm verify against local scratch data, checking its actual exit code.
- Generated migrations applied from zero.
- Nine deliberate-break probes rejected by the intended assertions.
- Existing screens and new functionality flows at phone and desktop widths.
- Linux CI verification and browser checks on the current PR commit.
- Final diff review: consent, ownership, schema/FKs, copy, preserved marketing.

The local pnpm 11 wrapper tries to reinstall pnpm 9 modules before scripts. Set
`pnpm_config_verify_deps_before_run=false` locally; no dependencies are changed.
Temporary Postgres listens only on 127.0.0.1:55432. Unit/integration and browser
runs use separate scratch databases. No test needs a remote DB or live delivery.

## Operational limits before live integration

This repairs fixture-backed functionality. Providers and real delivery gates stay
closed; launch economics and the separate GO_LIVE checklist remain outstanding.
Refresh provider adapters remain an integration task.

Public password-recovery email needs a transactional adapter and issuance
throttling before launch. Local reset credentials are never disclosed publicly.

Unknown delivery outcomes require provider reconciliation. Never clear a claim
or force a resend solely because a DB receipt is absent. Pending legacy content
without a fingerprint fails closed; admin recompose is limited to never-attempted
recipients.

Stripe is an external operation, not a distributed DB transaction. Verify account,
product/pricing and reconciliation after ambiguous API failures before enabling
real billing. The existing live-secret-key refusal remains intact.

No merge or deployment is authorized by this packet. Unrelated logs and reference
archives are excluded from its changes.
