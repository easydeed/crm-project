# OR-037 — Re-skin: the final sweep

Drafted by the builder. Approved by the Director with Decisions A, B and C as
defaulted and the amendment at the end.

```
TASK: OR-037
BRANCH: feat/reskin-sweep

OBJECTIVE
Close everything the screen packets left behind:
- the last 9 linkClass copies and 3 buttonClass copies, ending with
  both copy lists empty and enforced at zero
- the missing <h1> on /login and /register
- the settings labels that sit beside their inputs
- the tokens-only scan widened to all of src/app
After this, the only open re-skin item is marketing.

WHY
Every remaining item is a leftover of one kind:
- a copy of a shared class that can drift
- an accessibility gap
- a tree nothing checks
The last one matters most. OR-036's break showed a debt entry doing
double duty as the only guard on its file. The scan still covers three
directories, not the tree, so marketing would be adding colour where
nothing looks.

SCOPE AND FINDINGS

1. Scan scope (Decision A)
   - The tokens-only scan in design-debt.test.ts covers app/, login/
     and register/. I ran its rules over everything else in src/app:
     - marketing (page, home-story, sample, error, loading): clean,
       nothing to list
     - api/ and u/: clean
     - src/app/digest/preview-panel.tsx: border-foreground/20 ×3 and
       bg-white ×2. Never scanned. It renders on the person page, in
       settings, on /sample and in admin preview.
   - FOUND, a real bug in that file: the plain-text preview is
     `bg-white text-foreground`. In dark mode --foreground is #ededed,
     which on white is 1.17:1, so the plain-text preview is unreadable
     in dark mode. Nothing caught it because nothing scanned the file.
   - The fix:
     - the <pre> becomes bg-background with --rule around it
     - the toggle buttons' off state, border-foreground/20, becomes
       --border (they are controls)
     - the iframe's frame becomes --rule
     - the iframe keeps bg-white, listed as a permanent entry: "the
       email's own canvas, shown as an inbox shows it, white in both
       themes". src/digest's email design is deliberately outside app
       tokens (design-scope), and this is its frame.

2. Copies of shared classes
   - linkClass, 9 copies:
     - app/error.tsx (+mt-6)
     - home-card.tsx (identical)
     - layout.tsx "Log out": adds text-foreground and the focus colour,
       both of which linkClass gets by inheritance
     - text-notice.tsx: a local linkClass with no 15px, inside a 15px
       sentence
     - people/error.tsx and people/[id]/error.tsx (+mt-6)
     - people/[id]/not-found.tsx ("tap")
     - sample/page.tsx and home-story.tsx (identical)
   - buttonClass, 3 copies:
     - home-card.tsx and home-billing-card.tsx: <Link>s, which become
       `${buttonClass} mt-6 inline-block`
     - home-story.tsx: marketing, `${buttonClass} inline-block`
     On a link, buttonClass's disabled state never applies; the focus
     colour is the only addition.
   - After this, shared-classes.test.ts's list is empty, and a new
     linkClass twin of it starts empty too. Both stay whole-tree, and
     both fail in both directions.

3. The <h1> (Decision C): copy as you gave it, "Sign in" and "Create
   your account".

4. The settings labels (Decision B). The cause is the shared fieldClass,
   not settings: the input is inline, so inside a <label> wider than
   max-w-sm it flows onto the label text's line. The same markup is in:
   - the person edit form
   - the review queue's no-parcel panel
   - group-manager and add-to-group
   - the bulk bar's selects

- Out of scope:
  - marketing's design, which is the next pass
  - the assessor-labelling product question, which stays recorded in
    the log
  - /admin
  - /u, which has its own CSS and scans clean anyway

DESIRED BEHAVIOR

1. DECISION A — the tokens-only scan covers all of src/app. APPROVED: yes.
   - One tree instead of a directory list, so there is nothing for a
     new route to fall outside of.
   - Exemptions stay explicit:
     - view-as-banner (EXEMPT, as now)
     - the admin entries (permanent, as now)
     - preview-panel's iframe canvas (new permanent entry, bg-white ×1)
   - Marketing enters the scan clean. The marketing pass will add
     colour under a check, and any colour it means to keep becomes a
     listed, owned entry.
   - Say "marketing exempt" to scan everything but marketing. I'd
     rather not: the next pass is the one most likely to bring hex in.

2. DECISION B — fieldClass gains `block`. APPROVED: yes.
   - One word in the shared class puts every label above its input,
     everywhere.
   - It moves every captured screen with a fieldClass input inside a
     wider label. I'd expect settings, and possibly people-bulk-bar and
     addons-lender-form. The measurement names them. That is the
     shared-classes pattern, and the log lists it.
   - The alternative is `flex flex-col` on settings' labels only. That
     leaves the same defect on the person edit form and the review
     panel, which no captured screen shows. Say "settings only" for
     that.

3. DECISION C — the <h1>s. APPROVED as written:
   - "Sign in" on /login and "Create your account" on /register
   - placed under the "onrecord" wordmark, which stays a <p>
   - 22px semibold, the app's h1 size
   - The login button also says "Sign in". That's fine: the heading
     names the page, and the button names the act.
   - Say otherwise if the wordmark itself should be the h1. I'd keep
     it a brand mark, not a page title.

4. Copies: as in SCOPE 2, with nothing reflowing beyond Decision B.

ACCEPTANCE CRITERIA
1. Every existing test passes unchanged, except:
   - design-debt's scan widens to the whole tree
   - shared-classes' list empties, by deleting entries; that is how the
     list is designed to shrink
2. New assertions:
   - a whole-tree linkClass-copy test with an empty list, failing both
     ways like shared-classes
   - fieldClass carries `block`
   - /login has one <h1> reading "Sign in", and /register one reading
     "Create your account"
   - preview-panel's <pre> sits on bg-background, and its toggles' off
     state uses --border
3. design-debt.test.ts: all of src/app is scanned. The only entries are
   permanent: admin's and preview-panel's iframe canvas.
4. The contrast test passes unchanged
5. The browser pass is 41/41 at both widths
6. The desktop comparison (exact, OR-030a), from a fresh seed, lists
   every changed screen with its reason. Expected:
   - settings (labels above inputs)
   - login and register (the <h1>)
   - person-detail (the preview's toggles and frame)
   - any other screen Decision B moves
   - dashboard should not change; if it does, the report says why
7. reskin-screen-log.md:
   - gains the OR-037 row
   - "Found, not fixed" shrinks to the assessor question alone
8. No dependency, no schema change, no test loosened. The only copy
   change is the two <h1>s, from Decision C.
9. Two deliberate breaks, each red in CI on its intended signal only,
   each reverted to an identical tree:
   - Cleared debt returns, in a tree that was never scanned: the
     preview <pre> back to bg-white. design-debt.test.ts goes red,
     which only the widened scan can do.
   - A new linkClass copy, sample/page back to its inline string. The
     new linkClass-copy test goes red with its empty list.
10. pnpm verify passes, CI green before merge

DO NOT
- Change any copy beyond the two <h1>s
- Restyle the email itself, or make its iframe canvas follow the theme
- Touch /admin, or marketing beyond swapping its two copies for the
  shared classes
```

## Found while drafting, not absorbed

- The dark-mode plain-text preview bug is fixed here, because it sits
  in the file the widened scan brings in.
- Nothing else. After OR-037 the open items are:
  - marketing
  - the assessor-labelling product question

## Amendment (Director)

```
Amendment to OR-037:

The dark-mode preview bug is the ninth check on this project found
checking less than its name said — this time by scope rather than by
matching. Add to the enforcement note in PROJECT_STATE.md:

  Scan trees, not lists. A check scoped to named directories leaves
  everything outside it unguarded, and nothing announces the gap. The
  tokens-only scan covered three directories while src/app/digest
  rendered the email preview at 1.17:1 in dark mode on four screens.
  Prefer whole-tree coverage with explicit, listed exemptions over an
  enumerated scope.
```
