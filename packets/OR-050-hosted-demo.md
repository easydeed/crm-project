# OR-050 — The hosted demo: migrate and seed the preview database, and a login that works

Rebuilt from scratch on 2026-10-15. The first build was never pushed and its session ended,
so nothing of it survives. Jerry asked for a straight run to a URL that can be signed into,
pushed after every step.

```
TASK: OR-050
BRANCH: claude/confident-einstein-lizlfp

OBJECTIVE
A Vercel preview anyone can open and sign into as the La Verne fixture agent.
The preview database is empty. One command migrates it and fills it.

SCOPE
1. scripts/demo-seed.ts, run as `pnpm demo:seed`:
   - Reads PREVIEW_DATABASE_URL and DEMO_AGENT_PASSWORD. Never DATABASE_URL,
     so the dev database can't be filled by accident.
   - The URL passes the same checks as DATABASE_URL (session pooler on 5432,
     never the crm project).
   - The password meets the app's own password rule.
   - Applies migrations through the existing `pnpm db:migrate`.
   - Inserts the La Verne fixture: never truncates, never deletes. A rerun
     inserts nothing new and resets the demo agent's password.
   - Refuses a database holding any account that isn't the fixture agent:
     a database with real accounts isn't the demo database.
   - Builds this month's call list, so the dashboard has names.
   - No subscription row: Billing shows "start a plan", which is true.
2. Tests: each refusal fails before connecting, with the reason printed.
   On the scratch database, two runs in a row leave the same rows, and the
   password signs in.
3. docs/PREVIEW.md: where each secret goes, the command, and what the demo
   shows and doesn't.

NOT IN THIS PACKET
- Any change to the app, the schema, or the existing seed.
- SEND_ENABLED, Stripe live mode, real providers.
