# SETUP — OR-000

Hand this whole file to Claude Code in Cursor. It is the first execution packet. Everything else in this repo is read by later packets; this one is executed now.

---

```
TASK: OR-000
BRANCH: main (direct — this is repo initialization)

OBJECTIVE
Stand up the onrecord repository: a Next.js 15 app, the Postgres schema,
the verification pipeline, and green CI on an empty application.

WHY
Every later packet depends on pnpm verify existing and passing. Nothing
can be reviewed until CI can independently verify it.

SCOPE
- Next.js app scaffold at the repo root
- Dependencies, scripts, config
- Drizzle schema for every table below
- Seed script with fixture data
- CI green
- Out of scope: auth, any UI beyond what create-next-app generates,
  any business logic. That is OR-001 onward.

DESIRED BEHAVIOR

1. Scaffold at the repo root, preserving the existing markdown files,
   .github/, scripts/, docs/, and packets/ directories:

     pnpm create next-app@latest . --typescript --tailwind --app \
       --eslint --src-dir --import-alias "@/*"

   If create-next-app refuses to write into a non-empty directory,
   scaffold into a temp directory and move the generated files in.
   Do not delete or overwrite any existing .md file, .github/,
   scripts/, docs/, or packets/.

2. Add dependencies:
     drizzle-orm, drizzle-kit, postgres (or @neondatabase/serverless),
     zod
   Add nothing else. If a later packet needs a dependency it will
   ask for it explicitly.

3. package.json scripts:
     "dev":       "next dev"
     "build":     "next build"
     "typecheck": "tsc --noEmit"
     "lint":      "next lint"
     "test":      "vitest run"
     "verify":    "pnpm typecheck && pnpm lint && pnpm test && node scripts/check-file-length.mjs && node scripts/check-invariants.mjs"
     "db:push":   "drizzle-kit push"
     "db:seed":   "tsx scripts/seed.ts"

   Add vitest and tsx as dev dependencies.

4. Drizzle schema in src/db/schema.ts, matching
   BUILD_PLAN.md and the architecture. Tables:

     accounts            id, email, password_hash, name, brokerage, dre,
                         phone, role ('agent'|'admin'), sender_name,
                         reply_to, accent_color, send_day, send_time,
                         timezone, paused, last_logged_in_at, mls_agent_id,
                         created_at

     contacts            id, account_id FK, name, email, phone,
                         address_raw, parcel_id FK nullable, close_date,
                         notes, status ('matched'|'needs_review'|'no_parcel'),
                         created_at
                         UNIQUE (account_id, lower(email))

     contact_subscriptions  contact_id FK, scope ('monthly'|'weekly'),
                         unsubscribed_at
                         PK (contact_id, scope)

     groups              id, account_id FK, name
                         UNIQUE (account_id, lower(name))

     group_members       group_id FK, contact_id FK
                         PK (group_id, contact_id), ON DELETE CASCADE

     parcels             id, apn, county, address, city, zip, lat, lng,
                         beds, baths, sqft, year_built, use_code,
                         assessed_value, base_year, base_year_value,
                         last_refreshed_at
                         UNIQUE (county, apn)

     parcel_events       id, parcel_id FK, kind, doc_number, recorded_at,
                         amount, party, raw jsonb
                         UNIQUE (county, doc_number)

     mls_listings        id, mls_id UNIQUE, zip, address, lat, lng, status,
                         list_price, list_date, close_price, close_date,
                         beds, baths, sqft, property_type,
                         listing_office, listing_agent, fetched_at

     sends               id, account_id FK, scheduled_for, state, created_at
     send_recipients     id, send_id FK, contact_id FK, html, sent_at,
                         provider_id
                         UNIQUE (send_id, contact_id)

     events              id, contact_id FK, send_id FK,
                         kind ('opened'|'clicked'), section, created_at

     subscriptions       account_id FK, stripe_customer_id, stripe_sub_id,
                         plan, status
     account_addons      account_id FK, addon_key, enabled, config jsonb,
                         enabled_at
                         PK (account_id, addon_key)

     admin_actions       id, admin_account_id FK, target_account_id FK,
                         action, detail jsonb, created_at

     jobs                id, kind, payload jsonb, run_after, attempts,
                         locked_at, completed_at, error

   Real foreign keys throughout. No polymorphic member_id.
   Uniqueness enforced at the database level, not in application code.

5. src/config/ca-tax.ts — statutory values in one place:

     export const CA_TAX = {
       effectiveDate: '2026-07-01',
       reviewBy:      '2027-07-01',
       prop13AnnualCapPct: 0.02,
       defaultTaxRatePct:  0.0115,   // LA County incl. direct assessments
       counties: ['Los Angeles','Orange','Ventura','San Diego','Riverside','San Bernardino'],
     } as const

   No statutory figure appears anywhere else in the codebase.

6. scripts/seed.ts — the La Verne fixture set:
   one agent (Dana Whitfield, Coastline Realty, DRE 01998432),
   47 contacts across the six counties, parcels and parcel_events for
   the matched ones, three unmatched (one a PO Box), and the three
   Oakdale Ave recorded sales.

7. .env.example with every variable the app reads. Never commit .env.

8. Run pnpm verify. It must pass.

ACCEPTANCE CRITERIA
1. pnpm install, pnpm dev, and pnpm build all succeed.
2. pnpm verify passes, including both custom scripts.
3. pnpm db:push creates every table listed above.
4. pnpm db:seed loads the fixture data without error.
5. No .md file, .github/, scripts/, docs/, or packets/ content was
   deleted or overwritten.
6. No dependency beyond those listed was added.
7. No statutory number appears outside src/config/ca-tax.ts.

DO NOT
- Build auth, UI, or business logic
- Add a UI component library beyond what create-next-app installs
- Add a dependency not listed above
- Modify PROJECT_STATE.md, CLAUDE.md, or BUILD_PLAN.md

BEFORE CODING, REPORT
1. Files you expect to create
2. Any dependency you believe is required beyond the list, and why
3. Any conflict between this packet and the existing repo contents

ON COMPLETION
Return the DIRECTOR_REPORT format from
docs/templates/completion-report.md.
```

---

## Then, by hand

Two things Claude Code can't do for you:

1. **Branch protection.** GitHub → Settings → Branches → protect `main`, require the `verify` status check to pass before merge. Without this, an approval is a rubber stamp on a self-authored report.

2. **Fill in `PROJECT_STATE.md` open questions.** The parcel cost and the MLS agent lookup result. Claude Code reads that file every session; a stale one means it builds on assumptions you've already disproven.

Then run `packets/OR-001-auth-and-shell.md`.
