# OR-005 — CSV import

```
TASK: OR-005
BRANCH: feat/import

OBJECTIVE
Agent uploads CSV or pastes a list; every row becomes a contact matched
against real parcels in Postgres.

WHY
Slice S2. Signup falls back to CSV. An unmatched person receives no
email, so import must run every row through the matcher and write a
status the People list can filter.

SCOPE
- findCandidateParcels(db, normalized) in src/matching/candidates.ts
- /app/people/import — Upload a file / Paste a list
- contact writes with accountId; view-as cannot import
- contact_match_candidates for needs_review rows
- parcels(zip) index and a city + street lookup index
- Out of scope: People list chrome (OR-006), review picker (OR-007),
  admin matching queue (OR-008), job queue

DESIRED BEHAVIOR

1. findCandidateParcels(db, normalized: NormalizedAddress): Parcel[]
   - Same ZIP first, then same city + similar street name if ZIP missing
     or empty.
   - At most ~50 parcels. Matcher scores.
   - MUST NOT take accountId. Parcels are shared reference data.
   - Must use indexes.

2. /app/people/import — two tabs: Upload a file, Paste a list.
   Drag-drop or choose .csv. Textarea one person per line, comma or tab.
   Auto column detection for Name, Full Name, First+Last, Email, E-mail,
   Address, Street+City+Zip, close date. If required column not confident:
   ONE step — dropdown beside each header “This is the ___”. No wizard.
   Required per row: name, email, address.

3. Per row: normalize → findCandidateParcels → matchAddress.
   Write contact with status matched | needs_review | no_parcel.
   parcel_id when matched. Persist candidates for needs_review
   (contact_match_candidates: contact_id, parcel_id, confidence, reason,
   rank; real FKs; cascade on contact delete).

4. Row-level failure only. Skip reasons exact:
   - No email — we can't send without one
   - Already in your list
   - Missing an address
   - Over your 250-person limit

5. Result screen: counts, Review them → /app/people?status=needs_review,
   See why, Go to your people.

6. Re-import same file adds nothing, all Already in your list.

7. 250 cap at import counting existing contacts.

Every contact write takes accountId. Session/view-as: read session at
route/action; assertWritable so view-as cannot import. effective
accountId at route. No ambient current account in db helpers.

Batch writes; one request for 250 rows. If it cannot finish in one
request, report timing and STOP — no job queue.

Schema changes allowed only as specified (indexes + contact_match_candidates).
unique() vs uniqueIndex: use uniqueIndex if adding unique constraints so
drizzle-kit push stays non-interactive. Push via pnpm db:push on
DATABASE_URL session pooler.

Four states on import screen. Accessibility: 15px+, focus rings,
contrast, reduced motion.

Seed/la-verne: use those 47 contacts as the 47-row CSV fixture for tests.

Parse CSV by hand or with existing deps. No papaparse unless you stop
and report.

ACCEPTANCE CRITERIA
1. 47-row La Verne CSV imports with correct status split
2. Paste == CSV
3. Column detection for listed header variants
4. Bad row skipped, file still imports
5. Re-import adds nothing
6. 251st skipped with limit reason
7. needs_review candidates persist across reload
8. findCandidateParcels uses an index (EXPLAIN)
9. 250 rows one request; report measured time
10. pnpm verify PASS. Push and open PR. Watch CI. Do NOT merge.

DO NOT
- Add a CSV library without reporting first and waiting
- Take accountId on findCandidateParcels
- Merge feat/import
- Add a job queue
- Touch crm production

BEFORE CODING, REPORT
1. Files you expect to create
2. No CSV library (or stop if you think you need one)
3. Any conflict with the existing schema

Then implement unless there is a genuine blocker.

ON COMPLETION
Push the branch, open a PR, and return the completion report format
in docs/templates/completion-report.md. Include the PR number.
Do not merge until GitHub Actions verify is green.
```
