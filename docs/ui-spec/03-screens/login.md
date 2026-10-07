# Sign in — `/login`

**Capture:** login (390 and 1440, signed out: `e2e/screens.ts:48`)

## What the agent came here to do

Get back into their account. An agent lands here three ways: from the "Sign in" link on the
marketing page (`src/app/home-story.tsx:43`), from the "Sign in" link under the create-account
form (`src/app/register/page.tsx:16`), or because they opened a signed-in page without a session.
Every signed-in page sends a visitor here with a `returnTo` address, for example
`redirect('/login?returnTo=/app')` (`src/app/app/page.tsx:13`). After signing in they go back to
that page, or to `/app` (the dashboard) if there was none.

This is the product's front door, not marketing. That is why it carries no Fraunces and no
display type (OR-036 Decision B, `packets/OR-036-reskin-auth.md`).

## Layout

One centred column, the same at 1440 and 390. The page has no responsive (`sm:`, `md:`, `lg:`)
classes, so nothing changes between widths except how much empty space surrounds the column.

- `<main>` fills the screen height and centres its child both ways, with a 16px side gutter
  (`flex min-h-screen items-center justify-center px-4`, `src/app/login/page.tsx:13`).
- A column at most 384px wide (`max-w-sm`), items centred, 24px apart (`page.tsx:14`). Top to bottom:
  1. The wordmark `onrecord`, 15px semibold. It is a `<p>`, not a heading or an image (`page.tsx:15`).
  2. The page heading `Sign in`, an `<h1>` at 22px semibold (`page.tsx:16`).
  3. The form, full column width, fields 16px apart (`src/app/login/login-form.tsx:11`):
     - "Email" label with its input underneath (`login-form.tsx:13-22`)
     - "Password" label with its input underneath (`login-form.tsx:23-32`)
     - the error line, only after a failed attempt (`login-form.tsx:33-37`)
     - the "Sign in" button (`login-form.tsx:38-44`)
  4. The text link `Create an account` (`page.tsx:18-23`).

Labels sit above their inputs because `fieldClass` is `block` (`src/app/app/people/ui.ts:15-16`).
That was made true everywhere in OR-037 after labels sat beside inputs on some screens.

On a phone (under 640px), every `button` and `input` is at least 44px tall, from the global rule
in `src/app/globals.css:106-114`. Desktop keeps its natural sizes.

The button is not full width: `buttonClass` sets no width, but the form is a flex column, so the
button stretches to the column (`login-form.tsx:11`). The link stays its text width.

Colours follow the light or dark system setting through the tokens. There is no theme switch
(PROJECT_STATE rejects a dark mode toggle).

## Controls

| Label (quoted) | What it does | Disabled look / when disabled | Where focus goes after |
|---|---|---|---|
| `Email` (input, `type="email"`, `autoComplete="email"`, required, `login-form.tsx:13-22`) | The account's email. Matched without regard to case or surrounding spaces (`src/auth/authenticate.ts:22`). | Never disabled. | n/a |
| `Password` (input, `type="password"`, `autoComplete="current-password"`, required, `login-form.tsx:23-32`) | The account's password. | Never disabled. | n/a |
| `Sign in` / `Signing in…` (button, `buttonClass`, `login-form.tsx:38-44`) | Submits the form to `loginAction` (`src/app/login/actions.ts:17`). On success sets the session cookie and navigates to `returnTo` or `/app`. | Disabled while the request is in flight (`disabled={pending}`), and the label reads `Signing in…`. Disabled look is `disabledClass`: --surface fill, --muted-ink words, an inset --border ring, never opacity (`ui.ts:9-10`). | On success, a full navigation to the new page. On failure, no `focus()` call exists; focus stays on the button and the error line is announced because it has `role="alert"`. |
| `Create an account` (link, `linkClass`, `page.tsx:18-23`) | Goes to `/register`. | Never disabled. | Navigation. |

Hidden field: `returnTo` (`login-form.tsx:12`). Only a same-site path is accepted; anything else,
including `//evil.example` or a full URL, becomes `/app` (`safeReturnTo`, `src/auth/session.ts:78-81`).

There is no "forgot password" link, no "remember me" box and no show-password toggle. None
exists in the code. Do not add one unless it is wired (invariant 1, "no dead controls").

## States

| State | What renders | Source |
|---|---|---|
| Populated (the form, empty fields) | Everything in Layout, no error line. | Captured: login. |
| Signing in | Button disabled, reads `Signing in…` (`login-form.tsx:43`). | Producible by hand (submit the seeded account). Not captured. |
| Wrong email or password | `That email and password don't match.` in a `<p role="alert">`, 15px, in --foreground, directly above the button (`login-form.tsx:33-37`, text from `actions.ts:27`). The same words whether the email exists or not. | Producible from the seed (any wrong password). Not captured. |
| Loading | No `loading.tsx` in `src/app/login/`. The nearest is the root one: `Loading onrecord` (`src/app/loading.tsx:4`). | Described from the code. |
| Error | No `error.tsx` in `src/app/login/`. The root one renders `We couldn't load this page.` and `Try again in a moment.` (`src/app/error.tsx:6-7`). It has no button. | Not producible from the seed; described from the code. |
| Empty | Not applicable: the screen shows no data. | — |

The error is deliberately not coloured. The v0 export put it in coral, the fill colour, at 13px;
OR-036 kept it --foreground with `role="alert"` ("Use --coral (fill) for error text, or colour an
error at all" is in its DO NOT list).

After a failed attempt, the fields are likely to be empty again: they are uncontrolled inputs with
no `defaultValue`, and React 19 resets a form's uncontrolled fields after its action finishes.
I read this from the code and the framework, not from a capture. A redesign that keeps the typed
email after a mismatch would be a behaviour change, not a re-skin.

## Fixed copy

- `Sign in` as the page's only `<h1>`. **Fixed**: `src/app/sweep.test.ts:12-17` ("each auth page has
  one <h1> that names it"). Before OR-037 the page had no heading at all, so a screen reader's first
  heading jump landed nowhere.
- `That email and password don't match.` (`actions.ts:27`). No test holds the words. The rule behind
  them is product and security: one message for both a wrong password and an unknown email.
  `src/auth/auth.integration.test.ts:64` asserts `authenticate` returns the same `{ ok: false }` for
  both, and `verifyPasswordOrDummy` runs a hash even when there is no account
  (`src/auth/password.test.ts:23`), so timing does not give it away either. Do not split this into
  "no account with that email" and "wrong password".
- The browser setup signs in by label and button name: `getByLabel('Email')`,
  `getByLabel('Password')`, and a button matching `/log in|sign in/i` (`e2e/auth.setup.ts:7-9`).
  **Fixed in effect**: renaming either label or the button to something else breaks every
  signed-in capture.

**Never show a password, a demo login or any credential on this page.** The v0 export printed a
demo password on its sign-in page (`docs/audits/OR-027-v0-audit.md:124, 407`). OR-036 lists this
first in its DO NOT block.

## Tests that assert on this screen

- `src/app/sweep.test.ts:12` — the page has exactly one `<h1>`, reading `Sign in`.
- `src/app/login/auth-reskin.test.ts:8` — the form imports the shared `fieldClass` and defines none of its own.
- `src/app/login/auth-reskin.test.ts:16` — the page's link uses `className={linkClass}`, not a copy of its string.
- `src/app/disabled-state.test.ts:43` — the button uses `buttonClass` (and so its disabled look), not a copy.
- `src/app/shared-classes.test.ts:30, 39` — `buttonClass` and `linkClass` are defined once across the tree.
- `src/app/design-scope.test.ts:31` — only the four allowlisted files may name Fraunces; this page is not one.
- `src/auth/session.test.ts:33` — `returnTo` accepts only same-origin relative paths.
- `src/auth/auth.integration.test.ts:64, 71` — a wrong password and a missing email look the same; the right password signs in.
- `e2e/auth.setup.ts:4-12` — signs in through this page by label; every signed-in capture depends on it.
- `e2e/screens.spec.ts:7-18` (capture "login", 390 and 1440): status under 400; no text matching
  `/couldn.t load|could not load/i`; then the layout rules in `e2e/checks.ts`: no horizontal scroll
  (`:23-24`), no text under 15px (`:66`), nothing clipped (`:68-75`), and on the phone every
  tappable control at least 44px (`:40-56`).
  - Note on the 44px rule: `Create an account` stands alone, so it is held to 44px on a phone. It
    carries `.tap` since OR-041 (`e2e/checks.ts:35-37` decides what counts as a link in a sentence).
- `e2e/desktop-unchanged.spec.ts` — on demand only: the 1440 capture must match its baseline pixel for pixel.

## What the v0 export did, and why we did not take it

The export's sign-in is `reference/v0-export/app/login/page.tsx`, inside an `AuthShell` with a
`RecordArtifact` beside the form.

| Export | Where | Why not |
|---|---|---|
| A printed demo password, and a mock check against it | audit `:124`, `:407` | Never show a credential (OR-036 DO NOT). |
| Fraunces headline `Sign in to your desk`, 30px | `login/page.tsx:59-61` | Fraunces is the marketing `<h1>` only (`design-scope.test.ts:20-31`). |
| `Welcome back` eyebrow, 11px mono uppercase | `login/page.tsx:54-56` | Under 15px and carries words (invariant 10). |
| Three blue progress bars, "setup complete" | `login/page.tsx:48-53` | Decorative and claims steps the flow does not show (OR-036). |
| Error in coral at 13px | `login/page.tsx:96` | Coral is a fill, not checked as a text pair; under 15px. |
| `New here? Create an account` at 14px in blue | `login/page.tsx:37-45` | Under 15px; --blue is not used in `/app`, and links stay `linkClass`. |
| `RecordArtifact`, a card with `['Est. market', '$792,000']` | `components/auth/record-artifact.tsx:49` | A home value estimate (forbidden, audit `:143-144`); 10–14px labels. |
| `setTimeout(() => router.push('/app'), 500)` | `login/page.tsx:30` | Mock auth with no session (audit `:407`). |
