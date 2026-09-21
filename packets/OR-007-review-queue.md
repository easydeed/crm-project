# OR-007 — Review queue

```
TASK: OR-007
BRANCH: feat/review-queue

OBJECTIVE
One place an agent fixes everyone not on the map, one at a time, and
cannot easily attach the wrong house.

WHY
Slice S2. Import and the People list already flag needs_review and
no_parcel. Without a picker, those people stay off the monthly email.
The last product lost trust when an agent attached the house next door.

SCOPE
- /app/people/review queue
- Replace /app/people/[id]/review stub
- Wrong house? on matched detail
- Schema: contacts.review_state pending | reviewed
- Out of scope: matcher scoring, admin matching, npm dependency

DESIRED BEHAVIOR

1. Queue every needs_review OR (no_parcel AND review_state pending),
   one at a time. Header: "Needs a look · 3 of 7" (accurate N of M).

2. People ?status=needs_review and import "Review them" link to
   /app/people/review. /app/people/[id]/review opens the queue at
   that contact.

3. needs_review: "You gave us:" exact typed name and address. Up to
   3 candidate cards (side by side desktop, stacked mobile). Each
   card: full street, unit if any, city, ZIP; Recorded owner if a
   grant deed party exists; beds · baths · sq ft when known;
   matcher plain reason. "Name matches" only when the contact last
   name appears in the recorded owner (case-insensitive, accent-fold).
   One button: "This one". "None of these" reveals no_parcel options.

4. Recorded owner is parcel_events.party on the latest grant deed
   (kind grant_deed) for that parcel. If none, omit the line. Never
   guess.

5. no_parcel: "We couldn't find this address."
   "Fix the address" → inline edit, re-run resolveAddressMatch.
   If matched, advance. If candidates, show them here. If still
   no_parcel, stay.
   "Leave them out" → no_parcel + review_state reviewed. Queue
   skips them. Muted: "They won't get the monthly email."

6. After a choice: persist, advance, Undo for 5 seconds. Undo is a
   real revert (status, parcel_id, candidates, review_state).
   Choosing a candidate: status matched, parcel_id set, candidates
   cleared.

7. Done, all resolved: "Everyone's on the map."
   Some left out: "All done. 2 people won't get the email until you
   fix their address." with a real People URL for those left out.
   Button: "Back to your people".

8. Wrong house? on /app/people/[id] for matched contacts. Quiet
   link under the parcel. Re-runs matching, same cards, EXCLUDE the
   attached parcel. Choosing one re-attaches.

9. Reuse resolveAddressMatch and persistContactCandidates. Every
   contact function takes accountId. assertWritable on mutations.
   Session at route/action only. Four states. Files ≤300. a11y.

ACCEPTANCE CRITERIA
1. Queue is every needs_review OR (no_parcel AND pending), one at a time
2. Header "Needs a look · N of M" is accurate
3. People Needs a look / import Review them link to /app/people/review
4. /app/people/[id]/review opens the queue at that contact
5. needs_review cards show typed name/address, up to 3 houses, owner,
   facts, reason, Name matches only on last-name hit, This one,
   None of these
6. Recorded owner is the latest grant_deed party; omitted if none
7. no_parcel copy, Fix the address rematches in place, Leave them
   out sets reviewed and skips them
8. Undo is a real 5-second DB revert
9. Choosing a candidate sets matched, parcel_id, clears candidates
10. Done states and left-out People link are real
11. Wrong house? rematches excluding the current parcel and can correct
12. Shared matcher path; accountId; assertWritable; four states;
    files ≤300; a11y
13. pnpm verify PASS. Open PR. GitHub Actions verify SUCCESS.
    Do NOT merge feat/review-queue.

DO NOT
- Change matcher scoring or thresholds
- Invent recorded owners
- Build admin matching
- Add an npm dependency
- Merge feat/review-queue
- Touch crm production eajfpzavqvcvwkeicdww

SCHEMA
Add contacts.review_state 'pending' | 'reviewed' (pgEnum). Default
pending. uniqueIndex, not unique(). db:push via session pooler
(DATABASE_URL :5432). Runtime stays DATABASE_POOLER_URL :6543
prepare:false.

BEFORE CODING, REPORT
1. Files to create and replace
2. Reuse of resolveAddressMatch + persistContactCandidates
3. Schema change: review_state
4. How recorded owner is selected

Then implement unless there is a genuine blocker.

ON COMPLETION
Push the branch, open a PR, wait for GitHub Actions verify SUCCESS,
and return docs/templates/completion-report.md. Include the PR URL,
CI URL, the review_state schema note, and how recorded owner is
selected. Report only checks you ran. Do not merge.
```
