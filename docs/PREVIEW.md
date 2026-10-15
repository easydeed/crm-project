# The hosted demo

A Vercel preview you can sign into as the La Verne fixture agent, Dana Whitfield (OR-050). The data
is the fixture data the browser pass uses. Nothing is sent: `SEND_ENABLED` is unset, so it is false.

## 1. A database of its own

A Supabase project for the demo only. Never crm-dev, never crm. The seeder refuses the crm project
and refuses any database that holds an account other than the demo agent's.

## 2. GitHub: the seeder's two secrets

Repository → Settings → Secrets and variables → Actions → New repository secret:

| Name | Value |
|---|---|
| `PREVIEW_DATABASE_URL` | The demo project's **session pooler** URL, port **5432** (Supabase → Connect → Session pooler). |
| `DEMO_AGENT_PASSWORD` | The password you will sign in with. At least 10 characters. |

The seeder runs in GitHub Actions, not in a Claude Code session: a Claude Code cloud container
can't open a Postgres connection, wherever the secrets are set.

## 3. Run it

Actions → **demo-seed** → Run workflow. The tab lists the workflow once it is on `main`.

It applies every migration, inserts the fixture, sets the password and builds this month's call
list. Its last line names the sign-in email and the counts. Rerunning it is safe and is how the
demo stays current: it never truncates or deletes, it sets the password again, and it moves the
street events to dates counted from the run, so the call list keeps its three tags.

From a machine that can reach the database, the same thing is `pnpm demo:seed`, with the two
values in the environment or `.env.local`. It never reads `DATABASE_URL`.

## 4. Vercel: what the app needs

Project → Settings → Environment Variables, scoped to **Preview**:

| Name | Value |
|---|---|
| `DATABASE_POOLER_URL` | The demo project's **transaction pooler** URL, port **6543**. The app reads this one, not the 5432 URL. |
| `SESSION_SECRET` | Any random string of at least 32 characters, e.g. `openssl rand -hex 32`. Without it, signing in fails. |

`DEMO_AGENT_PASSWORD` does not go in Vercel. The app checks the password against the hash the
seeder wrote.

Redeploy the preview after adding them. Vercel reads environment variables at deploy time.

## 5. Sign in

Open the preview URL, go to `/login`, and sign in as `dana@coastline.example` with
`DEMO_AGENT_PASSWORD`.

What it shows: the dashboard with three people to call, People with matched, needs-review and
no-parcel rows, the review queue, a person's page and the note preview. What it doesn't: Billing
shows no plan, and starting one fails without a Stripe test key. No cron runs on a preview, so
nothing is composed or sent.
