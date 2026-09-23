# OR-000d — migrations

Branch: fix/migrations

Schema changes become reviewable SQL files in drizzle/, applied by
pnpm db:migrate. CI builds a scratch database from zero, fails loudly
when a migration does not apply, and reports drift against crm-dev.
Drops the orphan call_log. Adds verify:fast.
