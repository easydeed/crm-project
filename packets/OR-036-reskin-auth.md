# OR-036 — Re-skin: sign in and create account

Drafted by the builder. Approved by the Director with Decisions A and B as
defaulted. The missing <h1> goes to the final sweep and is recorded in the log.

```
TASK: OR-036
BRANCH: feat/reskin-auth

OBJECTIVE
/login and /register restyled with the OR-028 tokens. Same fields, same
order, same copy, same errors. Clears the two auth debt files and swaps
the two linkClass copies. Puts both screens under the browser pass and
the exact desktop comparison for the first time.

WHY
These are the only screens an agent sees before signing in, so they
are the first impression. They are also the only agent-facing screens
the browser pass has never captured. Every token and font change since
OR-028 has reached them unmeasured.

SCOPE
- e2e/screens.ts and e2e/screens.spec.ts: login and register join the
  captured screens (Decision A). This goes in a first commit with no
  visual change, so the comparison has a measured "before".
- login/login-form.tsx and register/register-form.tsx (debt): each
  keeps a local fieldClass that is the shared one with
  border-foreground/20 and without max-w-sm.
  - Both forms are max-w-sm already, so the shared fieldClass renders
    the same box with the --border outline: 1.53:1 to 3.61:1 light,
    1.66:1 to 4.22:1 dark.
  - The local copies are deleted.
- login/page.tsx and register/page.tsx: their identical linkClass
  copies become linkClass. Their rows leave "Found, not fixed".
- design-scope.test.ts: "no Fraunces" extends from /app and /admin to
  /login and /register (Decision B)
- design-debt.test.ts: delete both entries and the OR-036 owner. Only
  permanent (admin) entries remain after this.
- Out of scope:
  - every word on both screens, including the plan line and the
    password requirements
  - auth actions, sessions and returnTo
  - the missing <h1> (see "Found")

CURRENT STATE (read from the code)
- Both pages: a centred max-w-sm column holding the "onrecord"
  wordmark, the form, and a link to the other page.
  - Login: email, password, an error line (role="alert", --foreground)
    and "Sign in".
  - Register: name, email, a password with its requirements listed
    above it, brokerage, DRE, phone and "Create account", then the plan
    line ("Next you add a card in Stripe: $19 a month…").
- Buttons already use buttonClass, with its OR-033a disabled state.
- The browser pass runs every screen with the signed-in state, and the
  auth screens are not in SCREENS.
- I probed both pages logged out (cookies cleared) against the existing
  layout rules, at 390 and 1440: no problems on either. Adding them
  costs nothing beyond the captures: 37 to 41 browser checks, 18 to 20
  desktop screens.

WHAT THE EXPORT DOES, AND WHY WE TAKE NONE OF IT
- A Fraunces display headline. The rule is Fraunces on marketing only.
  Sign-in is the product's front door, not marketing (Decision B).
- "Demo: onrecord", a password printed on the sign-in page. Never.
- Error text in --coral, the fill colour, which is not checked as a
  text pair. Ours stays --foreground with role="alert".
- A blue filled submit button and a blue "Sign up" link. --blue is
  still unused in /app; buttonClass and linkClass stay.
- A row of blue progress bars across register. It is decorative and
  claims steps the flow does not show.

DESIRED BEHAVIOR

1. DECISION A — capture login and register. APPROVED: yes.
   - SCREENS gains { name: 'login', path: '/login', loggedOut: true }
     and the same for register. The spec clears the context's cookies
     before visiting a loggedOut screen, so the page renders as a
     visitor sees it.
   - The first commit makes this change alone. The comparison then runs
     from that commit to the restyle, so both screens have a real
     "before", byte for byte.
   - Say no to keep them unmeasured, as today. The packet then reports
     before and after captures instead of an exact comparison.

2. Debt: both forms use the shared fieldClass; both entries and the
   OR-036 owner are deleted.

3. DECISION B — no Fraunces on the auth screens, enforced. APPROVED: yes.
   - The standing rule names /app and /admin. /login and /register are
     neither, so today nothing stops the export's serif headline.
   - The design-scope test's directory list gains them.
   - Say no if you see sign-in as marketing, the first page of the
     story rather than the first page of the product.

4. linkClass replaces the two copies; they are identical, so nothing
   moves.

ACCEPTANCE CRITERIA
1. Every existing test passes unchanged, including auth.integration and
   design-scope's three other tests.
2. New assertions:
   - login-form and register-form use people/ui.ts's fieldClass and
     define none of their own
   - login/page and register/page use linkClass and carry no copy
   - design-scope: nothing under /app, /admin, /login or /register names
     Fraunces or font-serif
3. design-debt.test.ts: both entries and the OR-036 owner are deleted.
   The only entries left are the permanent admin ones, and the /app scan
   passes.
4. The contrast test passes unchanged
5. The browser pass is 41/41 at both widths
6. The desktop comparison (exact, OR-030a), from a fresh seed, runs from
   the capture-only commit to the restyle. Expected: login and register
   only, for the input outlines.
7. reskin-screen-log.md:
   - gains the OR-036 row
   - notes that the capture set grew to 20 screens
   - drops the two linkClass rows
8. No dependency, no schema change, no copy change, no test loosened
9. Two deliberate breaks, each red in CI on its intended signal only,
   each reverted to an identical tree:
   - Cleared debt returns: register's password input gains
     border-foreground/20 beside the shared class. design-debt.test.ts
     goes red as new debt, and nothing else.
   - The export's headline: a font-serif <h1> on the login page. The
     extended design-scope test goes red. Before this packet, nothing
     would have caught it.
10. pnpm verify passes, CI green before merge

DO NOT
- Show a password, a demo login or any credential on either page
- Use --coral (fill) for error text, or colour an error at all
- Add Fraunces, --blue, progress bars, or any element the flow doesn't
  have
- Change copy, field order, autocomplete attributes or the plan line
```

## Found while drafting, not absorbed

- **Neither auth page has an <h1>.** The wordmark "onrecord" is a <p>,
  and the form has no heading. A screen reader's first heading jump
  lands nowhere. Fixing it means adding words ("Sign in", "Create your
  account"), so it is copy and structure, not colour. It is not
  OR-036's to decide. I'd put it to the final sweep or its own
  one-line packet.
- After OR-036, design-debt.test.ts holds only permanent admin entries.
  The final sweep inherits:
  - 9 linkClass copies
  - 3 buttonClass copies
  - the unlabelled assessor facts (a product question)
  - the desktop labels-beside-inputs layout on settings (from OR-034)
