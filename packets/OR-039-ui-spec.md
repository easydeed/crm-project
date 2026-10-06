# OR-039 — UI spec for a design pass

Written by the Director and handed to the builder to build as written.

> Framing note (Director): what makes this useful to a designer isn't the screen inventory, it's the
> constraints — the markup tests, the contrast floors, the copy rules. The v0 export was beautiful and
> unusable because it didn't know them. Give the designer the fences and it can do something good
> inside them.

```
TASK: OR-039
BRANCH: docs/ui-spec

OBJECTIVE
One document describing every agent-facing screen, control, state and
constraint, complete enough that a designer who has never seen the repo
could redesign any screen without breaking it.

WHY
A design pass is coming. The v0 export was good-looking and unusable
wholesale: 419 of 422 markup tests would have failed, every control was
under 44px, and it removed the delete confirmation entirely. None of
that was carelessness — it did not know the rules. This document is the
rules, plus everything a designer needs to reason about the product.

SCOPE
- docs/ui-spec/ — one file per area, an index, written for a reader
  outside the repo
- Out of scope: any code change. This packet writes documentation only.

AUDIENCE AND VOICE
Write for a designer, not a developer. Name what a thing does and why it
is there before naming its class. Avoid repo shorthand unless you define
it. Where a rule exists because something went wrong, say what went
wrong — a constraint with a reason survives; one without gets argued
away.

STRUCTURE

docs/ui-spec/00-index.md
  What the product is, who uses it (a working agent, median age 57, on a
  phone between appointments), and how to read these files. A one-screen
  map of every route.

docs/ui-spec/01-constraints.md  ← the most important file
  Everything a redesign may not break, each with its reason and the test
  that enforces it:
  - the eleven-ish markup and copy tests, by name, file and line: what
    each asserts, why it exists, and what it would catch
  - the contrast floors and every token pair, light and dark, with
    actual ratios and which pairs have no headroom
  - the 44px tap target rule and its one exemption (inline links)
  - the 15px minimum, and where 11-12px is correct (email, legal
    captions)
  - no opacity to show state, and the disabled-button treatment
  - colour never carries meaning alone
  - no horizontal scroll at 390px
  - the four states every screen needs
  - dark mode: every token has a dark value
  - the copy rules: the cancel flow, the MLS framing sentences at full
    contrast, the delete confirmation, the plain-language ban list
  - the asymmetry: a switched-off add-on row must not look unavailable;
    a disabled button must

docs/ui-spec/02-system.md
  Tokens with values and ratios. Type scale. Radii. The border-not-shadow
  rule. Fonts and where each is allowed. The shared classes
  (buttonClass, destructiveButtonClass, linkClass, fieldClass,
  mutedClass, disabledClass, sendCardClass) — what each is for, and the
  fact that changing one moves every screen using it.

docs/ui-spec/03-screens/*.md  — one per screen
  For each of: dashboard, people, person detail, person edit, review
  queue, import, start, add-ons, settings, billing, cancel, login,
  register, unsubscribe:
  - what the agent came here to do
  - the layout, top to bottom, at 1440 and at 390
  - every control: label, what it does, what it looks like disabled,
    where focus goes
  - every state, including empty, loading, error, and the odd ones
    (paused, system-paused, view-as, quiet month, found-nothing)
  - the copy that is fixed and may not be reworded, quoted exactly
  - which tests assert on this screen
  - what the v0 export did here and why we did not take it

docs/ui-spec/04-email.md
  The monthly digest: its blocks, the order, the skip rules, and why its
  design is deliberately unlike the app — serif, document-like, 12px
  footer. State plainly that app tokens must never reach src/digest, and
  that the email is out of scope for an app redesign.

docs/ui-spec/05-open.md
  Everything known to be imperfect and unowned: the assessor facts shown
  without a source label, the comprehension gap on the marketing page,
  the missing privacy and terms pages, the settings forms' remaining
  quirks, anything else in the log's "Found, not fixed".

METHOD
Read the code, not your memory of it. Every control, state and copy
string is quoted from the source. Where a screen has a state you cannot
produce from the seed, say so rather than describing it from the code's
intent.

Where a capture exists, reference it by name. Do not embed images.

ACCEPTANCE CRITERIA
1. Every agent-facing route has a file, and 00-index lists them all
2. Every constraint in 01-constraints names its enforcing test by file,
   and a reader could tell from the file alone what would break it
3. Every fixed copy string is quoted exactly and marked as fixed
4. Every token pair in 02-system carries its real ratio, light and dark
5. A reader outside the repo could, from this document alone, redesign
   any screen without breaking a test — state in the report where you
   think that is not yet true
6. No code changed; no test changed
7. pnpm verify passes, CI green before merge

DO NOT
- Change any code, test or copy
- Describe intent where you can quote the source
- Write it for a developer
```

> Director's closing note: "magical" and "legible to a 57-year-old in a parking lot" pull
> against each other, and most of what made the v0 export unusable came from resolving that
> tension toward the screenshot. The constraints file is where it gets resolved the other way.
