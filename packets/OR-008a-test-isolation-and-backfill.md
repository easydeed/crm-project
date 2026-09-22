# OR-008a — Test isolation and no_parcel_kind backfill

```
TASK: OR-008a
BRANCH: fix/test-isolation-and-backfill

OBJECTIVE
Integration tests are deterministic, and the gate metric counts existing
rows correctly.

WHY
Pooler timeouts under parallel load make CI green untrustworthy.
Null no_parcel_kind on the La Verne PO Box counts as a real street and
deflates the auto-match rate.

SCOPE
- vitest unit vs integration projects
- Integration tests use DATABASE_URL :5432 only
- Each integration test creates and cleans its own account
- Backfill no_parcel_kind via the matcher classification helper
- Out of scope: matcher scoring, status/parcel/candidate writes, merge
  of later packets

DESIRED BEHAVIOR
1. Split tests into two vitest projects: unit (parallel, no database) and
   integration (serial, file parallelism off). pnpm test runs both.
   Integration tests use the session pooler, never the transaction pooler.
2. Every integration test creates its own account and cleans up after
   itself. No test depends on or mutates La Verne seed data.
3. Backfill no_parcel_kind on existing no_parcel rows by re-running only
   the matcher's classification. Do not change any contact's status,
   parcel, or candidates.

ACCEPTANCE CRITERIA
1. pnpm test passes five consecutive local runs with zero timeouts
2. Integration tests run serially; unit tests stay parallel
3. No integration test reads or writes La Verne seed rows
4. The La Verne PO Box row reports no_parcel_kind 'non_address'
   after backfill (schema enum; director wording: not_an_address),
   and the auto-match rate excludes it
5. pnpm verify passes, CI green before merge

DO NOT
- Change matcher logic
- Change any contact's match status
- Add an npm dependency
- Touch crm production eajfpzavqvcvwkeicdww
```
