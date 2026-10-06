# onrecord — UI spec

This folder describes every screen of onrecord: its controls, its states and its rules. It is
detailed enough that a designer who has never opened the code could redesign any screen
without breaking it. Everything here was read from the source, not from memory or intent.
Where a state can't be produced from the seed data, the screen file says so.

## What the product is

onrecord is a subscription for California real-estate agents, at $19 a month for up to
250 homeowners. It does three things:

- Once a month, it emails each homeowner the agent knows a short note about their own
  house, built from the county's recorded documents and tax roll. Examples are what the
  neighbours sold for, and what the county taxes their house on compared with what a
  buyer would pay.
- It hands the agent **three names worth calling** this month, each with the reason.
- It costs nothing to keep running. Setup is meant to take minutes, and then it runs on
  its own.

It is **not** a CRM, **not** lead generation, and **not** a newsletter tool
(`PROJECT_STATE.md`). Every added screen is a liability.

## Who uses it

A working residential agent, median age 57, who already pays for a CRM they don't open.
They check onrecord on a phone, between appointments, often outdoors. They want to know
who to call and why, in a few seconds.

Design for that person first:

- large, plain words
- one obvious action per screen
- nothing that needs to be learned

The desktop gets the same layout, wider.

There are three other audiences:

- **Homeowners** receive the email and may land on the unsubscribe page. They are not
  customers and never log in.
- **Prospects** see the marketing page and the sample note.
- **Staff** use `/admin`. It is deliberately unstyled and out of scope for any redesign.

## How to read these files

1. **`01-constraints.md` first, always.** It covers what a redesign may not break, why,
   and which test fails if it does. The v0 design export broke nearly all of it without
   knowing it existed.
2. **`02-system.md`** covers the colour tokens with real contrast ratios, the type scale,
   the radii and the shared styles. Change a shared style and every screen using it
   changes.
3. **`03-screens/`**, one file per screen. Each covers:
   - what the agent came to do
   - the layout at 390px and 1440px
   - every control
   - every state
   - the copy that is fixed and may not be reworded
   - the tests that assert on it
   - what the v0 export did there and why we didn't take it
4. **`04-email.md`** covers the monthly email. It has its own design, deliberately unlike
   the app, and is out of scope for an app redesign.
5. **`05-open.md`** covers what is known to be imperfect and has no owner.

**Words used throughout:**

- **Capture.** A screenshot the automated browser pass takes of a screen, named in
  `e2e/screens.ts` (for example `people-bulk-bar`). Each is taken at 390px and 1440px
  wide. The screen files reference captures by name.
- **Token.** A named colour such as `--surface`, defined in `src/app/globals.css`.
- **Pair.** A foreground and background token combination that the contrast test checks.
- **Fixed copy.** Words a test asserts exactly, or that carry a legal or product rule.
  Don't reword these in a mock.
- **The export.** The v0 design export in `reference/v0-export/`. It is a visual
  reference only; nothing in the app imports from it. `docs/audits/OR-027-v0-audit.md`
  audits it.
- **The seed.** The demo data a local database is filled with (`scripts/seed.ts`): one
  agent, Dana Whitfield of Coastline Realty, with 51 contacts.

## Every route

**Agent-facing.** Signed in, inside the app chrome (top bar, Log out).

| Route | Screen | File | Captures |
|---|---|---|---|
| (every `/app` screen) | The top bar, Log out and the view-as banner | `03-screens/top-bar.md` | on every app capture |
| `/app` | Dashboard: send status, three people worth a call, homeowners | `03-screens/dashboard.md` | `dashboard`, `dashboard-call-open` |
| `/app/people` | People: the list, search, filters, groups, bulk actions | `03-screens/people.md` | `people`, `people-bulk-bar` |
| `/app/people/[id]` | One person: their record, groups, email preview, delete | `03-screens/person-detail.md` | `person-detail` |
| `/app/people/[id]/edit` | Edit a person | `03-screens/person-edit.md` | not captured |
| `/app/people/[id]/review` | Review one person's address match | `03-screens/person-review.md` | not captured |
| `/app/people/review` | The review queue: pick the right house, one person at a time | `03-screens/review-queue.md` | `review-queue` |
| `/app/people/import` | Add people: upload or paste a list, map columns | `03-screens/import.md` | `import` |
| `/app/start` | Signup step 2: find the homes you've sold on the MLS | `03-screens/start.md` | `start`, `start-found`, `start-few`, `start-nothing`, `start-malformed` |
| `/app/addons` | Add-ons: switches, the lender form, the monthly bill | `03-screens/addons.md` | `addons`, `addons-lender-form` |
| `/app/settings` | Settings: details, how the email looks, sending, phone | `03-screens/settings.md` | `settings` |
| `/app/settings/billing` | Billing: plan, card, invoices | `03-screens/billing.md` | `billing` |
| `/app/settings/billing/cancel` | Cancel the plan | `03-screens/cancel.md` | `billing-cancel` |

**Signed out.**

| Route | Screen | File | Captures |
|---|---|---|---|
| `/login` | Sign in | `03-screens/login.md` | `login` |
| `/register` | Create an account (signup step 1) | `03-screens/register.md` | `register` |
| `/` | Marketing home | `03-screens/marketing.md` | `home` |
| `/sample` | A sample note | `03-screens/marketing.md` | `sample`, `sample-text-dark` |

**Homeowner-facing.**

| Route | Screen | File | Captures |
|---|---|---|---|
| `/u/[token]` | Unsubscribe and email preferences, reached from the email's footer | `03-screens/unsubscribe.md` | `unsubscribe` |
| (inbox) | The monthly email | `04-email.md` | not captured; shown in the app's preview panel |

**Out of scope.**

- `/admin/*`: accounts, costs, deliverability, jobs, matching, preview and sends. It is an
  internal tool, unstyled by decision.
- `/api/*` serves no screens.

## The flow, in one paragraph

1. A prospect reads `/` and opens `/sample`.
2. They create an account at `/register` and add a card in Stripe.
3. They land on `/app/start`, where an MLS agent ID finds the homes they've sold. Those
   import as homeowners: the note goes to whoever lives there now.
4. They can upload their own list of past clients at `/app/people/import`.
5. Each address is matched to a county parcel. The ones that can't be matched with
   confidence wait in `/app/people/review`.
6. Every month, the email goes out, and `/app` shows who is worth a call and why.
7. Settings and add-ons are there for the few who want them. Cancelling is one sentence
   and one button.
