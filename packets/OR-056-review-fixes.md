# OR-056 — Independent review fixes

Owner-authorized 2026-10-21. Base `1088036` (merged PR #75).
Branch `codex/or-056-review-fixes`; draft PR only. No merge, ready transition,
or deployment. Other editors remain paused.

Fix the six supplied findings: checkout activation pricing, targeted admin
recomposition, external billing rollback safety, failed text switch-off reporting,
off-site login redirects, and consent/deletion changes after composition.

Prove each protection with an intended failing assertion under deliberate break,
then restore exact bytes. Full Linux verification and browser pass are required.
Compare exact desktop pixels to main on one machine; marketing must be identical.
Record every test change and any uncertainty. Add OR-055 screen log rows, the
login-mismatch instability finding, and the production demo-env checklist item.

No dependency or schema change is planned. Round two explicitly removes the
branch-specific Vercel exclusion and evidence workflow condition. No manual deploy.

Round two also requires checkout creation-error recovery; bounded, transaction-
pooler-safe locking; DB-only feature reads with separate reconciliation; surfaced
call-list billing failures; and durable STOP recovery independent of Twilio retries.
The safe recompose policy remains unchanged. Repeat Linux verification, browser/
pixel evidence and deliberate-break proofs, then stop for independent review.
