# OR-033a — Disabled buttons without opacity

Drafted by the builder. Approved by the Director with Decision A as defaulted
(no aria-disabled) and the additional scope at the end. Cross-cutting; runs
after OR-033 and before OR-034.

```
TASK: OR-033a
BRANCH: feat/disabled-state

OBJECTIVE
No button in the app shows its disabled state with opacity. A disabled
button looks unavailable in checked token pairs: --surface fill,
--muted-ink text, a --border outline, and a not-allowed cursor. The
seven copies of the opacity suffix go, and the primary-button copies
become the shared buttonClass.

WHY
"Never opacity to show state" is a standing rule. Seven button strings
break it, and every packet that adds a button copies the suffix again.
Opacity also gives no checked contrast: 60% of a pair is a pair the
contrast test never sees.

The asymmetry this packet must keep:
- A disabled button should look unavailable. It is a control that will
  not respond.
- An off add-on row must not look unavailable. It is a state the agent
  chose and can reverse.
OR-021's on/off test stays exactly as it is.

SCOPE
- src/app/app/people/ui.ts:
  - a new `disabledClass` suffix
  - buttonClass and destructiveButtonClass lose disabled:opacity-60 and
    take disabledClass
- Copies of buttonClass become buttonClass, with their margin kept:
  - settings/save-button.tsx (mt-4)
  - people/import/import-form.tsx (its local buttonClass, mt-6)
  - login/login-form.tsx and register/register-form.tsx (identical
    strings)
  - addons/addon-config-form.tsx (self-start). Its string never had the
    opacity; it becomes buttonClass, as you asked.
- call-entry.tsx: secondaryClass loses the opacity and takes
  disabledClass. It is an outlined button, not a buttonClass copy, so it
  keeps its own string.
- addons/addon-row.tsx: the "Go to Settings" link becomes linkClass.
  linkClass adds text-[15px]; the link sits in a 15px paragraph, so
  nothing moves.
- New tests (below). No existing test changes.
- Out of scope:
  - every other inline copy of linkClass's string; see "Found, not
    absorbed"
  - /admin, which stays unstyled and has no opacity

CURRENT STATE (read from the code)
- All seven are native <button> elements with the disabled attribute,
  set by pending, readOnly or an empty selection:
  - buttonClass
  - destructiveButtonClass
  - call-entry secondaryClass
  - settings save-button
  - import-form's local buttonClass
  - login-form and register-form
- Nothing in /app uses aria-disabled.
- The only opacity utilities in src/app are these seven
  disabled:opacity-60 suffixes.
- Primary buttons have no border. Adding one would change every primary
  button's size by 2px and move every screen.

DESIRED BEHAVIOR

1. disabledClass, in people/ui.ts:
     disabled:cursor-not-allowed disabled:bg-surface
     disabled:text-muted-ink disabled:ring-1 disabled:ring-inset
     disabled:ring-border
   - The outline is an inset ring (a box shadow), not a border, so a
     button is the same size enabled and disabled. Nothing shifts when
     a form starts saving.
   - Pairs, all already in tokens.test:
     - muted-ink on surface: 4.56:1 light. It is the pair whose comment
       names its dependents; this packet adds a line for disabled
       buttons.
     - border on surface: 3:1 non-text.
   - The words stay ("Saving…", "Import", "Delete"). Colour repeats the
     state; it never carries it alone.

2. DECISION A — aria-disabled. APPROVED: no attribute added; native
   disabled stays.
   - Your answer said "plus aria-disabled and cursor-not-allowed".
     cursor-not-allowed is in. On aria-disabled, the code says something
     worth deciding on.
   - Every one of these is a native <button disabled>. That already
     tells assistive technology the control is unavailable, and it
     already blocks the click and the form submit. aria-disabled on top
     of native disabled says the same thing twice.
   - aria-disabled earns its place only in place of native disabled: the
     button stays focusable and announced as unavailable, and the code
     must then block clicks and submits itself, in seven places, three of
     them forms. That is a behaviour change in a styling packet, and the
     kind that lets a double-submit through.
   - So: native disabled everywhere, and a test that every button styled
     as disabled is a native <button> with a disabled prop. Say "yes" if
     you want focusable disabled buttons anyway. That would be its own
     packet, with click guards and tests per form.

3. The off-row asymmetry is written where the next builder will see it:
   - a comment on disabledClass: "for controls that will not respond;
     never for a state the agent chose (an off add-on row)"
   - a comment in addon-row.tsx pointing back to it

ACCEPTANCE CRITERIA
1. Every existing test passes unchanged, including:
   - OR-021's on/off row test
   - People's Delete tests
   - the 15px and focus-ring tests
2. New assertions:
   - No source file under src/app (tests aside) contains an opacity
     utility. This is a whole-tree scan, with no allowlist.
   - buttonClass, destructiveButtonClass and call-entry's secondaryClass
     each end in disabledClass.
   - disabledClass uses exactly bg-surface, text-muted-ink and
     ring-border, and ['muted-ink', 'surface', TEXT] and
     ['border', 'surface', NON_TEXT] are in PAIRS.
   - save-button, import-form, login-form, register-form and
     addon-config-form use buttonClass and carry no copy of its string.
   - addon-row.tsx uses linkClass for "Go to Settings".
3. The contrast test passes; the only change is the dependents comment
   on muted-ink/surface.
4. The browser pass is 37/37 at both widths.
5. The desktop comparison (exact, OR-030a), from a fresh seed, lists
   every changed screen. Expected: any captured screen showing a disabled
   button, which I have not predicted. The measurement names them, and
   the log gives each one's reason.
6. reskin-screen-log.md gains the OR-033a row and a line under "Shared
   classes move screens early".
7. No dependency, no schema change, no copy change, no test loosened.
8. Two deliberate breaks, each red in CI on its intended signal only,
   each reverted to an identical tree:
   - disabled:opacity-60 put back on buttonClass: the no-opacity scan
     goes red. This proves the rule is now enforced, not remembered.
   - disabledClass's fill changed to bg-coral-soft: the pair test goes
     red, because muted-ink on coral-soft is not a checked pair. This
     proves the disabled state's contrast is tested, not assumed.
   This packet clears no design-debt entries, so the cleared-debt-returns
   break does not apply here. OR-034 picks it up again.
9. pnpm verify passes, CI green before merge.

DO NOT
- Use opacity, a filter or a blur to show any state
- Make an off add-on row, an unticked closing or any chosen state look
  disabled
- Replace native disabled with aria-disabled (Decision A)
- Change button words, sizes, margins or behaviour
- Touch /admin
```

## Found while drafting, not absorbed

- **Inline copies of linkClass's string.** About 25 of them sit outside
  /admin. They are in:
  - home-card.tsx, text-notice.tsx and app/error.tsx
  - start/error.tsx and settings/page.tsx (the "tap" variants)
  - settings/error.tsx and three billing files
  - people/error.tsx, [id]/error.tsx and [id]/not-found.tsx
  - import-result.tsx
  - layout.tsx (the "Log out" link)
  - sample/page.tsx, home-story.tsx, login/page.tsx and register/page.tsx

  Some differ from linkClass: no text-[15px], a "tap" class, or
  text-foreground. They are identical in colour, so none is debt.

  Each one belongs to the packet that owns its screen:
  - settings and billing: OR-034
  - start and import: OR-035
  - login and register: OR-036
  - dashboard and layout: already shipped

  I'd have each packet swap its own copies, as OR-032 and OR-033 did,
  and leave the shipped ones for one small sweep at the end. Folding all
  25 in here would make this packet a copy sweep across screens it
  doesn't own.

## Additional scope (Director)

```
Additional to OR-033a:

Add the 25 inline linkClass copies to docs/audits/reskin-screen-log.md
under "Found, not fixed", with their owning packets:
  OR-034: settings, billing
  OR-035: start, import
  OR-036: login, register
  final sweep: dashboard, layout, people errors, sample, home-story

Note which differ from linkClass and how — missing text-[15px], the
"tap" variant, text-foreground — so the sweep knows which are genuine
copies and which are deliberate variants. None is colour debt.
```
