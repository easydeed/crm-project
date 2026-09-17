# OR-000b — crm-dev DATABASE_URL and CI push

```
TASK: OR-000b
BRANCH: feat/or-000b-crm-dev

OBJECTIVE
Point db:push, db:seed, and CI at the crm-dev Postgres database.

SCOPE
- DATABASE_URL in .env.local points at the Supabase "crm-dev" project.
  Use it for db:push and db:seed.
- Supabase is a Postgres host only. Do not add @supabase/supabase-js,
  Supabase Auth, or RLS policies. Tenancy is enforced by accountId being
  a required argument on every data-access function.
- Never connect to the "crm" project from any script, test, or CI job.
- Add a CI step that runs db:push with secrets.DATABASE_URL.

NOTE
The first attempt used the direct db.<ref>.supabase.co:5432 host, which
is IPv6-only. Session-pooler follow-up is OR-000c.
```
