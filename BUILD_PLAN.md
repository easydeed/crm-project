# onrecord — MVP build plan

Read with `PROJECT_STATE.md` and `CLAUDE.md`. This file defines the slices. Each slice becomes one or more execution packets.

---

## How this is sliced

**Vertical, not horizontal.** No "build all the schema, then all the API, then all the UI." Every slice cuts top to bottom and ends with something real.

Every slice delivers three things:

| Line | What it means |
|---|---|
| **Agent** | Something a paying agent can do |
| **Admin** | Something you can see or fix when it breaks |
| **Signal** | One number that tells you if the business works |

The admin line is not a later phase. Build it inside each slice, because the slice isn't finished if you can't see it working in production.

## Stack

Next.js 15 App Router · TypeScript · Postgres (Neon) · Drizzle · Tailwind · shadcn/ui · Postmark · Stripe · Vercel. Jobs are a `jobs` table plus a Vercel cron hitting a protected route. No Redis, no separate worker, no queue service until a send exceeds the cron window.

## Roles

```
role: 'agent' | 'admin'
```
One column on `accounts`. `/admin/*` requires `admin`. No separate auth system, no separate app. Admin sees everything; agents see only their own account, enforced at the query layer with a required `accountId` argument on every data function.

---

# The slices

## S0 — Foundation
*No user-facing output. Keep it to one day.*

Repo, CI from the scaffold, Drizzle schema for every table in the architecture doc, seed script with the La Verne fixture data, `pnpm verify` green, auth with email + password, `accounts` table with `role`.

**Done when:** CI passes on an empty app and you can register, log in, and land on a blank `/app`.

---

## S1 — The shell and the empty state

**Agent** — Registers, logs in, sees `/app` with an honest empty state: "No people yet." Top bar with People · Add-ons · Settings. Settings saves name, brokerage, DRE, phone, accent color, send day, timezone, and reads them back.

**Admin** — `/admin/accounts` lists every account: name, email, signup date, contact count, plan, last login. Click through to `/admin/accounts/[id]` with a **View as this agent** action (read-only impersonation, banner pinned across the top, all writes blocked).

**Signal** — Registrations per day.

*Packets: OR-001 auth + shell, OR-002 settings, OR-003 admin accounts.*

---

## S2 — People and matching
*The highest-churn screen in the product. Budget the most time here.*

**Agent** — Upload a CSV or paste a list. Each row hits the address matcher. People page shows name, address, and one plain-English status: `On the map` · `Needs review` · `No parcel`. The review screen shows up to three candidate parcels side by side with a "None of these" option. Groups live inside People — create, rename, delete, filter. Search covers the whole list. Export CSV. Edit and delete a person.

**Admin** — `/admin/matching`: every `needs_review` and `no_parcel` row across all accounts, with the raw input and what the matcher returned. This is your matcher training set. Plus a match-rate number per account and overall.

**Signal** — **Match rate.** If it's under 90% the product doesn't work, because an unmatched person gets no email.

*Packets: OR-004 schema + matcher against fixtures, OR-005 CSV import, OR-006 People list + groups, OR-007 review UI, OR-008 admin matching queue.*

---

## S3 — The digest renderer
*Build this before the sending. It is the product.*

**Agent** — Settings shows a live preview of their own digest. `/app/people/[id]` shows that person's rendered digest.

Renderer is a pure function: `(parcel, events, listings, agent) → { html, text, subject }`. No database calls, no network, no clock. Tested against fixtures including every thin case: no street sales, no nearby listing, no recorded loan, missing sqft, PO box.

**Blocks:** record stamp · parcel map · four-doors-down comparison · Prop 13 · street sales · loan as recorded · one CTA · footer. Any block with no data omits itself; the email must still look finished with only two blocks present.

**Admin** — `/admin/preview?contact=<id>` renders any contact's digest, plus a "render every contact in this account" view that flags any digest with fewer than two blocks.

**Signal** — % of contacts producing a full-strength digest.

*Packets: OR-009 renderer core + fixtures, OR-010 thin-case handling, OR-011 preview surfaces.*

---

## S4 — It sends

**Agent** — Dashboard shows "Your next email goes out [date] to N homeowners" with Preview and Skip. On the 1st it sends. Homeowners get it. `/unsubscribe` works with two scopes and an update-address path that feeds back into matching.

**Jobs** — the five from the architecture doc, idempotent, each with a unique constraint guarding re-runs: `refresh_parcels` (day −7) · `refresh_mls` (day −3) · `compose` (day −1) · `send` (day 0) · `build_call_lists` (day 0).

**Admin** — `/admin/sends`: every run with queued / sent / opened / bounced / complained, and a per-run failure list with the raw provider error. Ability to re-run a failed send for one account. Suppression list view.

**Signal** — **Delivery rate and complaint rate.** Complaints above 0.1% and the product is on fire.

*Packets: OR-012 jobs runner, OR-013 compose + send, OR-014 unsubscribe + two scopes, OR-015 admin send monitor.*

---

## S5 — The call list

**Agent** — Three names on the dashboard with a reason tag and a Call button that opens the person's phone number and record, with "Mark as called" persisting.

Signals, in priority order: a past client's home is now listed · a neighbor listed or sold nearby · their loan was paid off or refinanced · they've opened three notes in a row.

**Admin** — Signal distribution across all accounts. If one signal fires 90% of the time, the ranking is broken.

**Signal** — % of accounts where all three slots fill.

*Packets: OR-016 signal computation, OR-017 dashboard call list.*

---

## S6 — Money

**Agent** — Stripe checkout at signup, $19/mo. Billing section in Settings with card on file, invoice history, and a cancel flow that plainly says what happens to their homeowners.

**Admin** — MRR, active/cancelled counts, and **cost per account**: parcel lookups this month × your rate, plus sends × rate, against $19. Sorted worst first.

**Signal** — **Gross margin per account.** This is the number the whole business turns on.

*Packets: OR-018 Stripe, OR-019 billing UI, OR-020 admin cost dashboard.*

---

## S7 — Add-ons framework + the first two

**Agent** — `/app/addons` with `Text me the call list` ($2) and `Add my lender` (free, config-gated). Live bill total. Everything else on that page is marked "Coming soon" and is not toggleable, or is absent.

**Admin** — Add-on adoption per account; ability to force-enable for support.

**Signal** — Attach rate.

*Packets: OR-021 addon framework, OR-022 text call list, OR-023 lender.*

---

## S8 — MLS signup lookup
**Gated on verification.** Do not start until `GET /properties?agent={id}&status=Closed` is confirmed to return usable history.

**Agent** — Registration step 2 offers "Find my closings" with an agent ID. Build the **found-nothing path first** — it is the common case for buyer's agents.

**Admin** — Lookup success rate, and how many agents fall through to CSV.

**Signal** — % of signups completing with a populated list.

*Packets: OR-024 provider method + fixtures, OR-025 signup flow.*

---

## Not in MVP

Weekly drip · consumer SMS · farm a street · automated campaigns · the whole `/lab` set · team accounts · `/agents` name search · bulk county data migration.

They are specced and rejected *for now*, not rejected forever. They stay out of the codebase until an agent pays for the base product.

---

# The admin surface, complete

One app, `/admin/*`, role-gated. Built slice by slice, but here is the whole target so nothing gets architected into a corner.

| Route | What it's for |
|---|---|
| `/admin` | Today: sends due, failures, match rate, MRR, cost per account. One screen you check each morning. |
| `/admin/accounts` | Every agent. Contact count, match rate, plan, last send, monthly cost, margin. |
| `/admin/accounts/[id]` | One agent. View-as, their people, their sends, force a resend, pause, toggle an add-on. |
| `/admin/matching` | Every unmatched and ambiguous address across all accounts. Your matcher's backlog. |
| `/admin/sends` | Every run. Delivery, bounce, complaint, failure detail, re-run. |
| `/admin/deliverability` | Bounce and complaint rates by recipient domain. Suppression list. Domain reputation notes. |
| `/admin/costs` | Parcel lookups, MLS calls, sends — by account and in total, against revenue. |
| `/admin/preview` | Render any contact's digest. Batch-render an account to spot thin ones. |
| `/admin/config` | County allowlist, tax config values with effective dates, feature flags. Read-only display of `config/ca-tax.ts` so you can confirm what's live. |

**Admin rules**

- View-as is read-only. Never write as another user.
- Every admin action that changes another account's data writes an `admin_actions` audit row: who, what, when, which account.
- Admin never sees a homeowner's data outside the context of the agent who owns it.
- No admin screen invents a metric. Every number traces to a table.

---

# Execution loop

1. Director writes a packet from this backlog using `docs/templates/execution-packet.md`.
2. Claude Code branches, inspects, implements, runs `pnpm verify`, opens a PR.
3. Claude Code returns the `DIRECTOR_REPORT`.
4. Director reads **the PR diff and the CI check**, not the report, and returns `APPROVED` / `REVISION REQUIRED` / `BLOCKED`.
5. Merge. Update `PROJECT_STATE.md` last-approved-commit and current task. Next packet.

One packet, one branch, one PR. If it needs two branches it is two packets.

**Stop points.** After S2, check the match rate. After S6, check the margin. Both are go/no-go, not status updates.
