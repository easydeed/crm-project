# OR-000c — session pooler, schema apply, constraint tests

```
TASK: OR-000c
BRANCH: feat/or-000b-crm-dev   (continue on the existing branch, update PR #1)

OBJECTIVE
Apply and verify the schema against crm-dev using the Supavisor session
pooler, which has IPv4. Close out OR-000 criteria 3 and 4.

WHY
The direct host is IPv6-only and unreachable from this network and from
GitHub runners. Session mode (port 5432) is Supabase's supported
replacement for direct connections and supports DDL. This supersedes the
earlier instruction to avoid the pooler — that instruction was about
transaction mode (6543), which does not support prepared statements and
is not suitable for migrations.

SCOPE
- Switch DATABASE_URL to the session pooler
- Run db:push and db:seed against crm-dev
- Fix whatever the push reveals
- Constraint integration tests
- Out of scope: new tables, new features, anything touching crm
- DATABASE_URL in .env.local points at the Supabase "crm-dev" project
  session pooler on port 5432. Use it for db:push and db:seed.
- Supabase is a Postgres host only. Do not add @supabase/supabase-js,
  Supabase Auth, or RLS policies. Tenancy is enforced by accountId being
  a required argument on every data-access function.
- Never connect to the "crm" project from any script, test, or CI job.

DESIRED BEHAVIOR

1. Two connection strings, both crm-dev:
     DATABASE_URL         session pooler, port 5432 — migrations, seed, CI
     DATABASE_POOLER_URL  transaction pooler, port 6543 — app runtime
   Document both in .env.example with a comment saying which is which
   and why. The runtime driver must set prepare: false when using 6543.

2. pnpm db:push applies the full schema. Verify these survive the push,
   and fix the schema where they don't:
   - UNIQUE (account_id, lower(email)) on contacts — functional index
   - UNIQUE (account_id, lower(name)) on groups
   - composite PKs on contact_subscriptions, group_members, account_addons
   - UNIQUE (county, doc_number) on parcel_events
   - every FK with its declared ON DELETE behavior
   Report every schema change you had to make.

3. pnpm db:seed loads the La Verne fixtures. Verify by query: 47
   contacts, 3 unmatched (one a PO Box), 3 Oakdale Ave recorded sales,
   one agent.

4. Integration tests, skipped when DATABASE_URL is absent, proving:
   - duplicate email on the same account is rejected
   - the same email on a different account is accepted
   - deleting a contact cascades its group_members rows
   - duplicate (county, doc_number) parcel_event is rejected

5. Update the GitHub Actions secret value you use to the session pooler
   string, and confirm the CI push step passes on the runner.

6. Carry over from OR-000b: next-env.d.ts gitignored, and `next build`
   at the front of the verify chain.

ACCEPTANCE CRITERIA
1. pnpm db:push succeeds against crm-dev
2. pnpm db:seed succeeds; the four counts are correct
3. All four constraint tests pass against the live database
4. CI verify passes end to end, including the push step
5. .env.example documents both URLs and which is used where
6. OR-000 criteria 3 and 4 now report PASS
7. Nothing connects to the crm project

DO NOT
- Use the transaction pooler (6543) for DDL
- Use the crm project
- Add the Supabase IPv4 add-on
- Add tables, columns, or dependencies
```
