# OR-008 — Admin matching

```
TASK: OR-008
BRANCH: feat/admin-matching

OBJECTIVE
Admin sees matching quality across accounts and exports failures as
fixtures. Read-only. Agent gets 404.

WHY
Slice S2 go/no-go is match rate. Without a cross-account view, homework
hides inside one agent's list.

SCOPE
- contacts.match_source and no_parcel_kind
- /admin/matching rates, per-account table, failure table, fixture export
- Write match_source on import, address edit, and review/wrong-house only
- Out of scope: matcher scoring, thresholds, npm dependency, merge

DESIRED BEHAVIOR

1. Schema
   contacts.match_source: 'auto' | 'review' | 'corrected'
     auto      = import or address edit, no review
     review    = agent chose a candidate in the queue
     corrected = Wrong house?
   contacts.no_parcel_kind: 'non_address' | 'unmatched' | null
     non_address = PO Box, empty, bare city, email, phone, name
     unmatched   = real street address we could not find
   uniqueIndex, not unique(). db:push via session pooler
   (DATABASE_URL :5432). Runtime stays DATABASE_POOLER_URL :6543
   prepare:false.

2. Write match_source on the three paths only. No admin writes to
   contacts. OR-008 has zero contact writes.

3. /admin/matching two numbers + raw counts. Exclude non-addresses
   from denominators (OR-004a):
     AUTO-MATCH RATE = auto matched ÷ real street addresses
     FINAL COVERAGE  = matched by any path ÷ real street addresses
   Same two numbers per account, sorted by auto-match rate ascending
   (worst first) so the accounts that need homework surface first.

4. Failure table: every contact across accounts that is needs_review,
   no_parcel with unmatched (real-address) reason, or corrected.
   Columns: raw input · matcher returned · candidates+confidence ·
   how resolved · account. Filter by status and account.

5. Export fixtures: filtered rows as
   { raw, expect, expectApn?, note? }. Address + APN only. Strip
   name and email. Valid parseable entries.

6. Reuse OR-001 admin role gate. 404 for agents.

ACCEPTANCE CRITERIA
1. Schema columns exist; written by import/edit/review; not by admin
2. AUTO-MATCH RATE excludes non-addresses
3. FINAL COVERAGE excludes non-addresses
4. Per-account rates sorted by auto-match rate ascending
5. Failure table + filters cover needs_review, unmatched no_parcel,
   corrected
6. Export is AddressFixture-shaped with no names or emails
7. Agent 404; admin role gate reused
8. Zero admin contact writes; match_source only on the three paths
9. pnpm verify PASS. Open PR. GitHub Actions verify SUCCESS.
   Do NOT merge feat/admin-matching.

DO NOT
- Change matcher scoring or thresholds
- Add an npm dependency
- Merge feat/admin-matching
- Touch crm production eajfpzavqvcvwkeicdww
```
