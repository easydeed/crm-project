# Erasure — the CCPA deletion path

**Specification only. Not built.** Building it needs counsel's read on retention first.

## Two different acts

| | Agent's Delete | Verified erasure request |
|---|---|---|
| Who asks | The agent | The homeowner, verified |
| Meaning | "Take them off my list" | "Delete my personal information" |
| Contact row | Soft delete (`deleted_at`) | Hard delete |
| Send history | Kept in full | Redacted, see below |
| Suppression | Kept | Kept (hash only) |
| Reversible | Yes: re-importing the address restores the row | No |

The agent's Delete is built (OR-006a). This document covers only erasure.

## What erasure does, in one transaction

1. **Redact send history.** For every `send_recipients` row of the contact, set `html`, `plain_text`, and `subject` to null. Keep `sent_at`, `provider_id`, `error`, and `permanent_failure`: they prove an email was sent, when, and through which provider message, without saying what it said or to whom.
2. **Detach history from the person.** `send_recipients.contact_id` and `events.contact_id` are NO ACTION (deferred) today, so the contact cannot be hard-deleted while they reference it. Erasure needs one of these, chosen when it is built:
   - make both columns nullable with ON DELETE SET NULL, restricted to the erasure path by test; or
   - replace `contact_id` with a per-row tombstone id before the delete.
3. **Keep the suppression.** The `suppressions` row is a sha256 hash, not an address. Keeping it is what stops a later re-import from mailing someone who asked to be forgotten. Counsel should confirm it's covered by the legal-obligation exception.
4. **Hard-delete the contact.** This cascades `contact_subscriptions`, `group_members`, `contact_match_candidates`, `call_list_entries`, and `call_log`.
5. **Log the erasure** without personal data: the account, a timestamp, the verification method, and the count of redacted rows.

## Not erased, by design

- `mail_events` holds raw provider webhook bodies, which include the address. Retention for these needs counsel's answer; the likely outcome is a time-bounded purge rather than per-person erasure.
- `sends.skips` holds contact ids only, not personal data.
- `suppressions` and `suppression_lifts` hold hashes only.

## Open questions for counsel

1. Does keeping the suppression hash after erasure fall under the legal-obligation exception, since CAN-SPAM requires honoring the opt-out?
2. How long may `sent_at` and `provider_id` be kept for a deliverability dispute?
3. Who receives the request: the agent (the business the homeowner knows) or onrecord (a service provider)? This decides who verifies identity.
4. What retention period applies to `mail_events` payloads?
