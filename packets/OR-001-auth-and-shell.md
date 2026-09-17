# OR-001 — auth, roles, and the app shell

The worked example. Every packet after this follows the same shape. Copy it, change the contents, keep the sections.

---

```
TASK: OR-001
BRANCH: feat/auth-and-shell

OBJECTIVE
An agent can register, log in, and land on an empty /app. An admin can
reach /admin. Neither can reach the other's routes.

WHY
Slice S1 in BUILD_PLAN.md. Every later slice needs an authenticated
account scope and a role gate. Nothing else can be built without this.

SCOPE
- Auth (email + password), session handling
- accounts table with a role column
- /app layout shell: top bar with People · Add-ons · Settings
- /app empty state
- /admin route gate only — no admin screens in this packet
- Out of scope: settings fields, people, billing, email sending,
  password reset, OAuth, magic links

CURRENT BEHAVIOR
Does not exist. Repo has the S0 schema and CI only.

DESIRED BEHAVIOR

/register
  Fields: name, email, password, brokerage, DRE number, phone.
  Password requirements shown before the user types, not after failure.
  On success: create account with role='agent', start a session,
  redirect to /app.
  Duplicate email: inline field error, not a page-level banner.

/login
  Email + password. One centered card, wordmark above, a link to
  /register below. Nothing else on the page.
  Wrong password: inline error reading
  "That email and password don't match." Never reveal whether the
  email exists.

/app  (requires role 'agent' or 'admin')
  Top bar: wordmark left; People · Add-ons · Settings right.
  On mobile these stay a visible row of three links. Not a hamburger.
  Body, empty state:
    Heading: "Let's get your people in."
    Body:    "Add the folks you've closed with and we'll match each
              address to the county record. Takes about four minutes."
    Button:  "Add your people"  →  /app/people

/admin  (requires role 'admin')
  A page reading "Admin" and nothing else. Screens come in OR-003.

Route protection
  Unauthenticated hitting /app or /admin → /login with a returnTo.
  role='agent' hitting /admin → 404. Not a 403, not a redirect —
  the route should not appear to exist.

IMPLEMENTATION GUIDANCE
- Use the established Next.js App Router patterns in this repo. Do not
  add an auth library without reporting it first as a dependency.
- Sessions: httpOnly, secure, sameSite=lax cookie. Password hashing
  with a modern KDF already available in the runtime or an approved
  dependency.
- Every data-access function takes accountId as a required argument.
  There is no ambient "current account" inside query helpers. This is
  the tenancy boundary and it is enforced by function signature.
- The top bar is a shared layout component reused by every /app route.
- Use the design tokens already in the repo. Do not introduce new
  colors or type scales.

ACCEPTANCE CRITERIA
1. Registering creates an account with role='agent' and lands on /app.
2. Logging out and back in restores the session.
3. Wrong password shows an inline error and does not disclose whether
   the email exists.
4. Duplicate email registration shows an inline field error.
5. An agent requesting /admin receives a 404.
6. An unauthenticated request to /app redirects to /login and returns
   to /app after login.
7. The /app empty state renders the exact copy above.
8. The top bar renders three visible links at 390px wide.
9. Every data-access function added takes accountId as a required
   parameter.
10. pnpm verify passes.

DO NOT
- Build any settings fields, people, or admin screens
- Add password reset, email verification, OAuth, or magic links
- Refactor the schema
- Add a dependency without reporting it first
- Anything in the Rejected Ideas table in PROJECT_STATE.md

BEFORE CODING, REPORT
1. Files you expect to modify or create
2. Any auth dependency you intend to add, and why the built-in
   approach is insufficient
3. Any conflict between this packet and the current schema

Then implement unless there is a genuine blocker.

ON COMPLETION
Push the branch, open a PR, return the DIRECTOR_REPORT format from
docs/templates/completion-report.md. Include the PR number.
```

---

## Director notes — not part of the packet

**Why this one is first.** Tenancy is the hardest thing to retrofit. Every query function taking `accountId` as a required argument is a decision that has to be made before there are fifty of them, not after. The previous product enforced tenancy with RLS plus explicit predicates, which worked — but it worked because it was there from the beginning.

**The 404 on `/admin`** is deliberate. A 403 confirms the route exists. For a product with one admin — you — there is no reason to acknowledge it.

**What to check in the diff.** Not whether it works; CI tells you that. Check whether `accountId` really is required on every data function, or whether it quietly reads a session inside a helper somewhere. That's the shortcut that looks fine and breaks tenancy six slices later.
