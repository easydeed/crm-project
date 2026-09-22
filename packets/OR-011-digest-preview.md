# OR-011 — Digest preview

```
TASK: OR-011
BRANCH: feat/digest-preview

OBJECTIVE
Digest can be seen by agent, admin, and as static files. Renderer stays
pure.

WHY
Slice S3 preview surfaces. Agents need to see the note before it sends.
Admins need to spot thin accounts. Static fixtures stay reviewable
without a database.

SCOPE
- src/digest/build-input.ts — the only db read for a digest
- pnpm digest:preview static files under preview/digest/
- /app/people/[id] preview
- /app/settings live preview beside How the email looks
- /admin/preview
- Greeting copy: "Hi Marilyn," — no time of day
- Out of scope: parcel map, sending, MLS feed, npm dependency

SIGNATURE

  buildDigestInput(db, accountId, contactId, asOf): DigestInput | null

  Assemble agent settings, contact, parcel, parcel events, street
  sales (same ZIP + street_name_norm, trailing 12 months). Contacts
  require accountId; other-account contact → null. Unmatched (no
  parcel) → null. nearbyListing is null. This is the only db read
  for a digest. renderDigest stays pure — no Date.now, no db, no
  fetch.

STATIC PREVIEW
  pnpm digest:preview renders every fixture scenario to
  preview/digest/<scenario>.html plus preview/digest/index.html with
  send decision and block list. Skipped scenarios show skip reason.
  Add preview/ to .gitignore.

AGENT SURFACES
  /app/people/[id] — "Preview their email." Sandboxed iframe
  (sandbox attribute, no email CSS leak). Toggles Desktop/Phone
  (600/380) and Email/Plain text. Skip → plain-language reason, no
  empty frame. assertWritable not needed for preview read.
  accountId required on data access.

  /app/settings — live preview beside How the email looks. First
  matched contact; re-render client-side with unsaved sender name /
  accent. No matched contacts: 1142 Oakdale fixture labeled
  "Sample — add your people to see theirs."

ADMIN
  /admin/preview — admin gate, agent 404.
  ?contact=id — same frame + toggles
  ?account=id — every contact: name, send decision, blocks, skip
  reason. Sort skipped first, then fewest blocks. Read-only.

GREETING
  "Hi Marilyn," — no time of day. Update digest greeting and
  affected scenarios/tests.

ACCEPTANCE
1. buildDigestInput assembles one digest from db; other-account and
   unmatched contacts return null; street sales are same ZIP +
   street_name_norm in the trailing 12 months
2. renderDigest stays pure: no db, fetch, or Date.now
3. pnpm digest:preview writes index.html and one file per scenario;
   skipped files show the skip reason
4. /app/people/[id] shows a sandboxed preview with Desktop/Phone and
   Email/Plain text; skip shows a reason and no empty frame
5. /app/settings shows a live preview beside How the email looks;
   unsaved sender name and accent update it; no matched contacts
   uses the 1142 Oakdale sample
6. /admin/preview is admin-only; ?contact and ?account behave as
   specified and are read-only
7. Greeting is "Hi <name>," with no time of day
8. Session is read at the route; tenant reads take accountId
9. Four states, a11y (focus rings, 15px, no dead controls)
10. No file over 300 lines; no new npm dependency
11. pnpm verify passes, CI green. Do NOT merge.

DO NOT
- Read a database inside renderDigest
- Build the parcel map
- Build sending
- Add a dependency
- Merge this branch
```
