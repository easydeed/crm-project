# Create your account — `/register`

**Capture:** register (390 and 1440, signed out: `e2e/screens.ts:49`)

## What the agent came here to do

Open an account and start paying. This is step 1 of signup. Submitting the form creates the
account, signs the agent in, and sends them straight to Stripe Checkout to add a card. Stripe then
returns them to step 2, `/app/start`, where they find the homes they have sold (see that screen's
file). If Checkout cannot be opened, the agent goes to `/app/start` anyway; the dashboard then says
the plan is not active and links to billing (comment at `src/app/register/actions.ts:41-42`).

The agent reaches this page from `Create an account` on the marketing page
(`src/app/home-story.tsx:40-42`) or on the sign-in page (`src/app/login/page.tsx:18-23`).

"Stripe Checkout" is Stripe's own hosted payment page. We do not draw it and cannot restyle it.
If the agent backs out of it, Stripe sends them to `/app/settings/billing`
(`cancelUrl`, `src/billing/account-billing.ts:54, 60`).

## Layout
Since OR-047:
- **The bar (OR-047).** The navy bar pair (`--bar`, words `--on-bar`), 44px, with the wordmark
  "onrecord" centred at 18px bold (`src/app/auth-bar.tsx`).
  - The wordmark is a `<span>`, not a link: on these screens it isn't a control, and the column
    already has its cross-link.
  - There is no nav and no identity line.
- **The column.** 384px (`max-w-sm`), 24px between blocks.
- **The heading.** `<h1>`, 24px semibold, centred, with its words unchanged.
- **The form** sits in a plain panel (`panelClass`), padded 24px top and bottom and 20px at the
  sides, with 18px between fields.
  - Each label's words are 16px semibold. The label element itself stays regular, because inputs
    inherit font and the typed text would otherwise be bold.
  - The fields are `fieldClass`, 48px and 17px.
  - The error line is 17px.
  - The submit button is full width.
- **The cross-link** is `linkClass`: 17px, 44px tall on phones, centred under the panel.
- **No field is ever filled in**, in code, fixtures or mocks (`auth-panels.test.ts`). The design drew
  this screen with a prefilled email and a masked password, and that was refused.
- **Register sits at the top**, as drawn: the form is long enough that centring it would push it off
  a phone.
- **Password** has a real `<label>`. The input's accessible name is "Password", and its rule ("At
  least 10 characters", in muted ink) is the input's description, through `aria-describedby`.
  - Before OR-047 the input had no accessible name or description at all.
- **A `--rule` line** comes before Brokerage, DRE number and Phone. The design's "Optional" after
  each was refused: it is new copy, and it would change three accessible names.
- **The plan line**, "Next you add a card in Stripe: {PLAN_LINE}. Cancel any time from Settings.",
  is 17px. It is still built from `PLAN_LINE`, never typed.

## Controls

| Label (quoted) | What it does | Disabled look / when disabled | Where focus goes after |
|---|---|---|---|
| `Name` (text, `autoComplete="name"`, required, `register-form.tsx:49`) | The agent's name. Stored trimmed (`src/auth/register-account.ts:58`). | Never. | n/a |
| `Email` (`type="email"`, required, `:50-57`) | Login and billing email. Stored lower-cased (`register-account.ts:40`). | Never. | n/a |
| `Password` (`type="password"`, `autoComplete="new-password"`, required, `:65-72`) | Must be at least 10 characters (`src/auth/password-rules.ts:1-8`). | Never. | n/a |
| `Brokerage` (`autoComplete="organization"`, optional, `:79`) | Stored, or null when blank (`register-account.ts:59`). | Never. | n/a |
| `DRE number` (optional, `:80`) | Stored, or null when blank (`register-account.ts:60`). | Never. | n/a |
| `Phone` (`type="tel"`, `autoComplete="tel"`, optional, `:81`) | Stored as 10 bare digits when it is a US number, otherwise kept as typed. Never refused (`signupPhone`, `register-account.ts:21-29`). | Never. | n/a |
| `Create account` / `Creating account…` (button, `buttonClass`, `:82-88`) | Creates the account, sets the session cookie, opens Stripe Checkout (`actions.ts:18-50`). | Disabled while in flight, reading `Creating account…`. `disabledClass` look: --surface fill, --muted-ink words, inset --border ring (`src/app/app/people/ui.ts:9-10`). | Success: leaves the site for Stripe. Failure: no `focus()` call; the error is announced through `role="alert"`. |
| `Sign in` (link, `linkClass`, `page.tsx:12-17`) | Goes to `/login`. | Never. | Navigation. |

Only `Name`, `Email` and `Password` are required. There is no terms or privacy checkbox, no
"confirm password" field and no show-password toggle.

**Accessibility gap, read from the code.** The password input has no accessible name. `Name`,
`Email`, `Brokerage`, `DRE number` and `Phone` are each wrapped in a `<label>` (`:25-40`). The word
`Password` is a plain `<p>` (`:59`) beside an input with no `id`, `aria-label` or
`aria-labelledby` (`:65-72`). The requirements list is not tied to the input with
`aria-describedby` either. No test checks this. A redesign should label the input and describe it
by the list; that is markup, not copy.

## States

| State | What renders | Source |
|---|---|---|
| Populated (the empty form) | Everything in Layout, no error lines. | Captured: register. |
| Creating | Button disabled, `Creating account…` (`:87`). | Producible by hand. Not captured. |
| Password too short | `Use at least 10 characters.` in a 15px `<p role="alert">` under the password input; the input gets `aria-invalid` (`:71-77`, text from `register-account.ts:36`). | Producible by hand. Not captured. The browser does not block a short password first: the input has no `minLength`. |
| Email already used | `That email already has an account.` in a `<span role="alert">` under the email input, which gets `aria-invalid` (`:33-39`, text from `register-account.ts:49, 67, 73`). | Producible from the seed: the seeded agent's email. Not captured. |
| Checkout could not open | No screen of its own. The account exists, and the agent lands on `/app/start` (`actions.ts:43-49`). | Not producible from the seed; described from the code. |
| Loading | No `loading.tsx` here. The root one: `Loading onrecord` (`src/app/loading.tsx:4`). | Described from the code. |
| Error | No `error.tsx` here. The root one: `We couldn't load this page.` / `Try again in a moment.` (`src/app/error.tsx:6-7`). | Not producible from the seed; described from the code. |
| Empty | Not applicable: no data is shown. | — |

Only one error shows at a time: the server checks the password first and returns before looking at
the email (`register-account.ts:32-50`). Errors are --foreground, not coloured (OR-036 DO NOT).

After an error the fields are likely cleared: they are uncontrolled with no `defaultValue`, and
React 19 resets a form's uncontrolled fields after its action finishes. Read from the code and the
framework, not from a capture. An agent who mistyped a short password re-types all six fields.

## Fixed copy

- `Create your account`, the page's only `<h1>`. **Fixed**: `src/app/sweep.test.ts:12-17`.
- The plan line, rendered as `Next you add a card in Stripe: $19 a month, up to 250 homeowners. Cancel any time from Settings.`
  (`register-form.tsx:89-91`). The middle comes from `PLAN_LINE`
  (`src/app/app/settings/billing/billing-copy.ts:3`), built from `PLAN` in `src/config/costs.ts:8-12`
  (price 1900 cents, 250 homeowners). **Fixed**: `PLAN_LINE` must equal `$19 a month, up to 250 homeowners`
  (`src/app/app/settings/billing/billing-ui.test.ts:46`). Never type the price into this page; prices
  live in `src/config/costs.ts` with an effective date (CLAUDE.md, and `scripts/check-invariants.mjs`
  rule `no-inline-cost-rates`). The sentence is also a product promise: cancelling from Settings is
  real (`src/app/app/settings/page.tsx:47` links to billing, which has `/cancel`). If cancel ever moves,
  this line must change in the same task (invariant 5).
- `At least 10 characters`, the one item in `PASSWORD_REQUIREMENTS` (`src/auth/password-rules.ts:2-4`).
  **Fixed**: `src/auth/password.test.ts:10-14` ("password requirements are visible copy, not a
  post-failure rule"). The requirement must be shown before the agent types, not only after a failure.
- `That email already has an account.` **Fixed**: `src/auth/auth.integration.test.ts:48-61`.
- `Use at least 10 characters.` Not held by a test. Note the `10` is typed into the sentence
  (`register-account.ts:36`) rather than read from `PASSWORD_MIN_LENGTH`; if the minimum changes,
  this sentence will not follow.

### No privacy policy or terms page exists

This form collects names, emails and phone numbers, and the product has no privacy policy and no
terms page. Neither exists anywhere in `src/app`, and nothing links to one. This is recorded in
`docs/audits/reskin-screen-log.md:104-108` as "No owner; flagged for Jerry", and the OR-038 Director
ruling calls it a CCPA question in California, not only a missing page. The rule until the pages
exist: **nothing may link to them, and no support or privacy address may be invented.** A design
that shows "By creating an account you agree to our Terms" has to wait for real pages.

**Never show a password, a demo login or any credential on this page.** (OR-036 DO NOT.)

## Tests that assert on this screen

- `src/app/sweep.test.ts:12` — exactly one `<h1>`, reading `Create your account`.
- `src/app/login/auth-reskin.test.ts:8` — the form imports the shared `fieldClass` and defines none.
- `src/app/login/auth-reskin.test.ts:16` — the page's link is `className={linkClass}`, not a copy.
- `src/app/disabled-state.test.ts:43` — the button uses `buttonClass`, not a copy of its string.
- `src/app/shared-classes.test.ts:30, 39` — `buttonClass` and `linkClass` defined once across the tree.
- `src/app/design-scope.test.ts:31` — Fraunces is allowlisted to four files; this page is not one.
- `src/app/app/settings/billing/billing-ui.test.ts:46` — the plan line's words and figures.
- `src/auth/password.test.ts:10` — the requirement says 10 characters; short fails, long passes.
- `src/auth/auth.integration.test.ts:26, 48` — register creates an agent; a duplicate email is refused with the quoted message.
- `src/auth/phone-normalize.integration.test.ts:34` — signup stores the phone as Settings would, never refusing it.
- `src/billing/billing.integration.test.ts:85` — checkout creates a subscription and the webhook activates the account (the step after this form).
- `e2e/screens.spec.ts:7-18` (capture "register", 390 and 1440): status under 400; no
  `/couldn.t load|could not load/i` text; the layout rules in `e2e/checks.ts`: no horizontal scroll
  (`:23-24`), no text under 15px (`:66`), no clipping (`:68-75`), 44px tap targets on the phone
  (`:40-56`). The `Sign in` link stands alone, so it is held to 44px; it carries
  `.tap` since OR-041 (`e2e/checks.ts:35-37`).
- `e2e/desktop-unchanged.spec.ts` — on demand only: pixel-exact at 1440 against a baseline.

## What the v0 export did, and why we did not take it

The export's `/register` (`reference/v0-export/app/register/page.tsx`) is a different product: a
**homeowner** signing up to follow their own house, not an agent opening an account. The audit
files it as "Real screen, wrong audience" (`docs/audits/OR-027-v0-audit.md:125`) and lists "the
homeowner `/register`" under "Ignore entirely" (`:439`).

| Export | Where | Why not |
|---|---|---|
| Fraunces `Start following your home` | `register/page.tsx:76-78` | Homeowner copy; Fraunces is the marketing `<h1>` only. |
| Three steps: account, address, `Is this your lot?` | `:15`, `:129-131`, `:172-174` | Our step 2 is the agent's MLS closings at `/app/start`, not a homeowner's address. |
| Blue progress bars and `Step {n} of 3` at 11px | `:49-61` | Decorative; under 15px; claims steps our flow does not have (OR-036). |
| No password field, a `Continue` button, and `setTimeout` redirects | `:106-112`, `:186` | Mock auth with no account or session (audit `:407`). |
| No plan line or price | — | Ours tells the agent before they submit that Stripe and $19 a month come next. |
| `RecordArtifact` beside the form, with `['Est. market', '$792,000']` | `components/auth/record-artifact.tsx:49` | A home value estimate (forbidden, audit `:143-144`). |
| Privacy and terms pages, linked from the marketing footer | `app/privacy/page.tsx`, `app/terms/page.tsx`; `components/marketing/marketing-footer.tsx:106, 109` | Placeholder legal copy with no real counterpart (audit `:136`). Linking to them would claim policies we do not have. |
