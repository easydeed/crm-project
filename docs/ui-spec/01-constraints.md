# 01 — What a redesign may not break

Read this file first. Everything else in this folder describes what is there. This file
describes what has to stay true, whatever it looks like.

Every rule below has three parts:

- **Why.** Most of these exist because something went wrong once. A rule with a reason
  survives a design review. A rule without one gets argued away, so the reason is the
  important part.
- **Enforced by.** The test that fails if the rule is broken, by file and line. "Not
  enforced" means a person has to hold it. Those are the ones to be most careful with.
- **What breaks it.** A concrete design move that would turn the test red.

A word on how the tests work, because it shapes what you can change freely. Most of these
tests read the source code, not the rendered pixels. They check that a sentence is present
word for word, that a button uses a named shared style, or that a class does not appear.
So a test can fail even when nothing looks wrong: renaming a shared style, splitting a
sentence across two elements, or copying a style string instead of reusing it are all red.
That is deliberate. Each of those once let a regression through.

## Why this file exists

A v0 design export was made for this product in 2026. It was good-looking and could not be
used. The audit (`docs/audits/OR-027-v0-audit.md` §5–§6) found:

- 17 test files and 75 tests that check markup or copy. The export's screens would have
  passed three of them.
- Its shared button and input were 32px tall, and about 138 controls were under 44px.
- About 440 uses of text sizes under 15px.
- No delete confirmation at all. Delete fired on click and showed a toast.
- A fabricated property record on one confirmation screen.
- A focus ring at 2.16:1, which is not visible enough to count.

None of that was careless. It did not know the rules. This file is the rules.

The person using this product is a working agent, median age 57, usually on a phone
between appointments, often outdoors. "Magical" and "legible in a parking lot" pull
against each other. Most of what made the export unusable came from settling that pull in
favour of the screenshot. This file settles it the other way, and leaves a lot of room
inside.

---

## 1. Layout: the browser pass

Every captured screen is loaded in a real browser at 390px (a phone) and 1440px (a desktop),
and measured. The list of screens is `e2e/screens.ts`, and the checks are `e2e/checks.ts`.
CI runs the phone pass on every pull request.

### 1.1 No horizontal scroll at 390px

- **Rule.** Nothing makes the page wider than the phone. Nothing is cut off by a container
  that hides its overflow, and no text runs past the right edge.
- **Why.** A page that scrolls sideways on a phone feels broken. An agent between
  appointments will not find a hidden column.
- **Enforced by.** `e2e/checks.ts:23-24` (no-horizontal-scroll), `:68` and `:74`
  (no-clipping), and `:83-84`, which requires the page width to equal the viewport.
- **What breaks it.**
  - A fixed-width table.
  - A long email address or document number with no wrapping.
  - A row of chips that does not wrap.
  - A `min-w-[…]` wider than 390.

### 1.2 Every tap target is at least 44px

- **Rule.** On the phone, every link, button, input, select, textarea, switch and
  `<summary>` is at least 44px in its *smaller* dimension. A checkbox or radio is measured
  by its label, so the label is the target.
- **The one exemption.** A link inside a line of text, a sentence with a link in it, is
  exempt (WCAG 2.5.8). A link that stands alone on its line is not exempt, and on a phone
  it takes the `.tap` class (`02-system.md`).
- **How the check decides.** A link counts as inside a sentence only when its own parent
  element holds words of its own (`e2e/checks.ts:35-37`). Until OR-041 the check asked
  whether the link's nearest block held *any* other text, so every link placed directly in
  a page column passed, standalone or not. OR-041 narrowed it and made the 13 kinds of link
  it then found 44px with `.tap`. That was the twelfth check on this project found checking
  less than its name said.
- **Owned exceptions.** A standalone link still under 44px must have an entry in
  `e2e/tap-allowlist.ts`, which names the packet that fixes it. Today there is one: each
  People row's name and "Edit" links, owned by OR-045, which redesigns that row. The list
  fails both ways: an unlisted small link is red, and an entry that matches nothing is red
  until it is deleted.
- **Why.** Fingers, not cursors. This is the rule the export broke most: its shared button
  and input were 32px.
- **Enforced by.** `e2e/checks.ts:52` (tap-44) and `:54-56` (the allowlist's other
  direction). It runs on the phone pass only. Desktop is not measured for tap size.
- **What breaks it.**
  - A 32px "compact" button.
  - An icon-only button smaller than 44×44.
  - A checkbox whose label wraps only the box.
  - A text link moved out of its sentence onto its own line, where it loses the exemption.

### 1.3 No text under 15px

- **Rule.** Nothing on a screen that carries information is under 15px. The app uses 15,
  17, 19 and 22px, plus 32 and 40px for the one marketing heading.
- **Where smaller is correct.** The monthly email, shown inside an iframe in the app, is
  not measured. Its 12px stamp labels, MLS attribution and footer are part of its own
  design (`04-email.md`). The same MLS attribution renders at 15px in the app
  (`src/digest/mls-attribution.tsx`, `variant="app"`). There are no legal captions under
  15px in the app, and there should not be.
- **Why.** Legibility for the actual user. The export had about 440 uses of sizes under
  15px.
- **Enforced by.**
  - `e2e/checks.ts:66` (text-15), on every captured screen at both widths.
  - `src/app/app/people/review/review-ui.test.ts:68` additionally requires the review
    screens' source to use 15 or 22px.
- **What breaks it.**
  - A 13px timestamp.
  - A 12px "helper" line.
  - An uppercase 11px section label.
  - A badge at `text-xs`.

### 1.4 What the browser pass does not see

Read this before trusting a green run.

- **Only listed screens are measured.** A state that no screen in `e2e/screens.ts`
  produces is never checked. Examples are a paused account, a system-paused account and
  the view-as banner (`03-screens/*` says which states are captured).
- **Dark mode is measured on one screen only.** That screen is `sample-text-dark`. Every
  other capture is light. Dark contrast is held by the token pairs (§2), not by a
  browser.
- **Focus rings are not measured in the browser.** See §6.
- **The People row links are under 44px by an owned exception** (§1.2), until OR-045.

---

## 2. Colour and contrast

### 2.1 Use the token pairs, and only the token pairs

- **Rule.** Every colour comes from a token in `src/app/globals.css`. A token can only be
  used in the combinations listed in `src/app/tokens.test.ts:37`, the PAIRS list, which
  is checked at 4.5:1 for words and 3:1 for non-text marks, in light and in dark.
  `02-system.md` has every pair with its real ratio.
- **Why.** Before the tokens existed, the app was full of `foreground/20`-style tints.
  Their contrast depended on what sat behind them, and nobody could say whether a line was
  readable. A pair list turns "is this readable?" into a test.
- **Enforced by.**
  - `src/app/tokens.test.ts:65` requires every token to have a light and a dark value.
  - `:70-79` check every pair against its floor, in both schemes.
  - `src/app/design-debt.test.ts:113` scans every source file under `src/app` for any
    colour that is not a token: hex in any length, `rgb()`/`rgba()`/`hsl()`/`oklch()`/
    `color-mix()` and the other functional forms, `foreground/20`-style opacity colours,
    Tailwind palette colours like `text-gray-500` or `bg-white`, arbitrary keyword values
    like `text-[red]`, and colour keywords in style props.
  - `:126` proves the scan recognises each of those spellings.
  - The only exceptions are listed in the file with a reason (admin, which is unstyled by
    decision, and the email preview's white canvas).
- **What breaks it.**
  - Any new colour.
  - A token used on a background it is not paired with, such as `--muted-ink` on
    `--blue-soft` (4.26:1, which fails).
  - A drop shadow written as `rgba(…)`. The export had 14 of those.

### 2.2 Pairs with no headroom

These are on the floor. Darken a background or lighten an ink by a step and they fail.
Redesign around them, not through them.

| Pair | Light | Dark | Floor | Used by |
|---|---|---|---|---|
| `--muted-ink` on `--surface` | **4.56** | 6.81 | 4.5 | every disabled button's words, the grey "Been a while" call tag, any muted line on a `--surface` row |
| `--coral` on `--surface` | **3.07** | 5.15 | 3 | coral marks on a filled row |
| `--green` on `--surface` | **3.10** | 5.10 | 3 | green marks on a filled row |
| `--border` on `--surface` | **3.31** | 3.68 | 3 | the disabled button's ring, any control outline on a filled row |
| `--coral` on `--background` | 3.35 | 5.91 | 3 | coral marks on the page |
| `--green` on `--background` | 3.39 | 5.85 | 3 | green marks on the page |
| `--muted-ink` on `--background` | 4.98 | 7.81 | 4.5 | secondary text |

The comment at `tokens.test.ts:45-48` names what depends on the tightest one. If
`--surface` is darkened, `--muted-ink` has to be re-derived with it.

### 2.3 Never blue text on `--blue-soft`

- **Rule.** `--blue-soft` is a selected or "current" fill. The words on it are
  `--foreground`, never `--blue`.
- **Why.** `--blue` on `--blue-soft` is 4.42:1 in light, under the floor. The export used
  exactly this pair for its current nav item and filters.
- **Enforced by.**
  - `src/app/app/top-bar.test.ts:24` (the current page in the top bar).
  - `src/app/app/people/people-ui.test.ts:155` (the current People filter).
  - `src/app/app/call-list.test.ts:155` (the "Taxes worth a talk" call tag).
  - `src/app/app/people/review/review-ui.test.ts:86` ("Name matches").
- **What breaks it.** Any `text-blue` on a `bg-blue-soft` element.

### 2.4 Fill colours and text colours are different tokens

- **Rule.** `--coral` and `--green` are for fills and marks, held at 3:1. Words in those
  colours use `--coral-text` and `--green-text`, held at 4.5:1.
- **Why.** The export's coral and green are 3.35:1 and 3.39:1 on white. That is fine for a
  dot and too faint for a word.
- **Enforced by.** The PAIRS list (`tokens.test.ts:37`). `--coral` and `--green` are
  paired only at the 3:1 floor, so using them for words is a pair the list does not
  allow. No test reads an element and checks that its words use the `-text` token, so a
  reviewer has to catch it.
- **What breaks it.** `text-coral` on an error line or a status word.

### 2.5 `--rule` is decorative; `--border` outlines something you act on

- **Rule.** `--rule` (1.29:1) is for dividers and card edges that only organise the page.
  `--border` (3.61:1) outlines a control, or anything whose edge tells you where to act.
- **Why.** A swap from an old tint to `--rule` once made a file drop zone fainter than it
  had been. The principle is that **a token swap must not make something fainter than it
  is today**.
- **The one documented exception.** On the review queue, candidate house cards take
  `--border`, because on a phone they stack, and the outline says which "This one" button
  picks which house (`src/app/globals.css:12-13`).
- **Enforced by.**
  - `src/app/app/people/review/review-ui.test.ts:94` (the card exception).
  - `src/app/app/start/start-reskin.test.ts:54` (the drop zone edge is `--border`, and the
    skeleton rows are `--rule`).
  - `src/app/sweep.test.ts:19` (the email preview toggles are outlined in `--border`).
- **What breaks it.** Outlining an input, a toggle or a drop zone in `--rule`.

### 2.6 Colour never carries meaning alone

- **Rule.** Every coloured tag also has words, and the words say everything the colour
  says. Someone who cannot see the colour loses nothing.
- **Why.** Colour-blind users, glare on a phone, and printouts.
- **Enforced by.**
  - `src/app/app/people/people-ui.test.ts:129` (each People status tag is a checked pair,
    and the label still renders its words).
  - `src/app/app/call-list.test.ts:65` (each call tag has its label: "Big sale next door",
    "Paid off their loan", "Taxes worth a talk", "Been a while").
- **What breaks it.** A coloured dot with no label, or a status shown only as a row tint.

### 2.7 Dark mode

- **Rule.** The app follows the phone's or computer's setting. Every token has a dark
  value. There is no theme switch.
- **Enforced by.** `src/app/tokens.test.ts:65`, with every pair checked in dark at
  `:70-79`. One dark screen is captured: `sample-text-dark`, the email preview's plain
  text.
- **What went wrong.** Until OR-037, the email preview's plain text was drawn on a
  hard-coded white background in the app's dark-mode ink: #ededed on white, 1.17:1,
  unreadable. Nothing caught it, because nothing scanned that file. Now the colour scan
  covers it, and a dark-mode capture fails if it returns
  (`e2e/screens.ts`, `sample-text-dark`).
- **What breaks it.** Any hard-coded white or black background behind token-coloured
  text.

---

## 3. State and controls

### 3.1 Never opacity to show state

- **Rule.** Nothing in the app uses opacity: not for disabled, not for "off", not for
  loading, not for decoration.
- **Why.** A faded control's contrast depends on what is behind it, so no test can check
  it. A faded word looks like it doesn't matter.
- **Enforced by.** `src/app/disabled-state.test.ts:19`, which scans every source file
  under `src/app` with no exceptions.
- **What breaks it.**
  - `opacity-50` on a disabled button.
  - `disabled:opacity-…`.
  - A faded "inactive" row.
  - An animated fade written with an opacity utility.

### 3.2 The disabled look

- **Rule.** A control that will not respond has a `--surface` fill, `--muted-ink` words
  and a 1px inset `--border` ring, with a not-allowed cursor. Only native controls are
  disabled: a real `<button disabled>`, never `aria-disabled` on a styled element.
- **Why.** Before OR-033a, disabled buttons were faded with opacity, and one set of phone
  verification buttons had no disabled style at all, so they looked live while a code was
  sending.
- **Enforced by.**
  - `src/app/disabled-state.test.ts:28` (the three tokens are checked pairs, and every
    button style ends with the disabled treatment).
  - `:59` (only native elements carry `disabled`; nothing uses `aria-disabled`).
  - `src/app/app/settings/settings-reskin.test.ts:23` (phone verification uses the shared
    button).
- **What breaks it.** A custom disabled colour, or a `<div role="button" aria-disabled>`.

### 3.3 The asymmetry: an "off" choice is not a disabled control

- **Rule.** On Add-ons, a switched-off add-on row looks exactly like a switched-on row,
  apart from the switch itself and its "Off" word. It must not look unavailable. A
  disabled button, by contrast, must look unavailable.
- **Why.** "Off" is the agent's own choice, and they can turn it back on. Greying it out
  says "you can't have this", which is false, and the export did exactly that.
- **Enforced by.** `src/app/app/addons/addons-ui.test.ts:21`. It renders a row on and
  off, removes the switch from both, and requires the rest to be identical, with no
  opacity, faded text or disabled styling.
- **What breaks it.** Muting an off row's name or price, or changing its badge colour.

### 3.4 The four states

- **Rule.** Every screen has loading, empty, error and populated states. An empty state
  names the next action, such as "No people yet. Add a list to get started."
- **Why.** A blank screen with nothing to do is the one an agent gives up on.
- **Enforced by.** Per screen, not across the tree:
  - `people-ui.test.ts:104`
  - `review-ui.test.ts:61`
  - `addons-ui.test.ts:64`
  - `settings-ui.test.ts:27`
  - `billing-ui.test.ts:40`
  - `call-list.test.ts:94` (the dashboard's call list)

  A new screen is not covered until it adds its own test. Each screen file lists its
  states.
- **What breaks it.** Deleting or rewording a `loading.tsx`, `error.tsx` or empty line
  that one of these tests quotes.

### 3.5 Shared styles are shared on purpose

- **Rule.**
  - Primary buttons use `buttonClass`.
  - Text links use `linkClass`.
  - Inputs use `fieldClass`.
  - Secondary text uses `mutedClass`.
  - Delete uses `destructiveButtonClass`.

  None of these is ever copied as a string.
- **Why.** Twenty-one copies of the link style and six copies of the button style were
  found and removed in OR-037. A copy drifts: one copy of the button style had no
  disabled state.
- **Enforced by.**
  - `src/app/shared-classes.test.ts:30` and `:39`. These scan the whole tree, and their
    allowlists are empty apart from the deliberately loud view-as banner.
  - Per-screen tests: `auth-reskin.test.ts:8,16`, `settings-reskin.test.ts:9,30`,
    `start-reskin.test.ts:59`, `review-ui.test.ts:109`, `addons-ui.test.ts:76,82,88`.
- **Consequence for a redesign.** Changing a shared style changes every screen that uses
  it, which is usually what you want. `02-system.md` lists them. Change the class, not
  its copies.

### 3.6 Delete asks first, and says what really happens

- **Rule.** Delete, on a person's page and in the People bulk bar, is the outlined coral
  button, and it asks for confirmation with the browser's own confirm dialog. The
  question is fixed:

  > `They'll stop getting the monthly note. If you import them again later, they'll come back.`

  It never says "cannot be undone", because that is false: a re-import brings them back.
- **Why.** The export deleted on click and showed a toast.
- **Enforced by.**
  - `src/app/app/people/people-ui.test.ts:120` (the sentence, and no "cannot be undone").
  - `:145` (the outlined coral button and `window.confirm(` on both screens).
- **What breaks it.**
  - Removing the confirmation.
  - Replacing it with an undo toast.
  - Rewording the question.
  - Making Delete a filled primary button.

### 3.7 Undo is five seconds

- **Rule.** "Mark as called" and "Not now" on the call list, and the review queue's
  choices, can be undone for five seconds.
- **Enforced by.** `src/app/app/call-list.test.ts:115` (`UNDO_SECONDS = 5`) and
  `review-ui.test.ts:54`.
- **What breaks it.** A confirm-then-redirect flow (the export redirected after 700ms),
  or a shorter undo.

### 3.8 The call panel opens inline, never as a modal

- **Enforced by.** `call-list.test.ts:102`: no `<dialog>`, no `role="dialog"`, no
  `aria-modal`, no full-screen fixed overlay. "Call" toggles to "Close" with
  `aria-expanded`. The panel's phone and email are real `tel:` and `mailto:` links.
- **Why.** On a phone, a modal over the list loses the agent's place in it.

### 3.9 Only "This one" picks a house

- **Enforced by.** `review-ui.test.ts:101`. Tapping a candidate card does nothing; only
  its "This one" button chooses it.
- **Why.** A whole-card tap target on a stacked list of similar houses was too easy to hit
  by accident while scrolling.

---

## 4. Copy rules

Copy is part of the design here, and some of it is legal or product policy. Wording a
designer changes in a mock gets built. Treat every quoted string in `03-screens/*` that
is marked **Fixed** as untouchable, and ask before rewording anything else. Copy changes
belong to a separate pass, not a redesign.

- **The cancel screen offers nothing.**
  - One sentence, one form, a filled "Cancel my plan" button and a plain "Keep my plan"
    link. No discount, offer, coupon, survey, reason or feedback, and no Stripe-hosted
    portal.
  - "Cancel my plan" is the filled primary button because cancelling is what the agent
    came to do. Shrinking it, outlining it in coral, or making "Keep my plan" the bigger
    target is retention by layout.
  - **Enforced by.** `billing-ui.test.ts:29` (the exact sentence, the banned words,
    exactly one `<form>`, no portal) and `settings-reskin.test.ts:16` (primary button and
    plain link).
- **The MLS framing sentences render at full contrast.**
  - The signup import is homes the agent *sold*, and the email goes to whoever lives
    there now, usually the buyer, not the seller the agent represented. Past clients come
    from the agent's own list.
  - The sentences that say so are what stop an agent mailing a stranger as if they were a
    client.
  - **Enforced by.**
    - `src/signup/signup.test.ts:88` (the words).
    - `src/app/app/start/start-reskin.test.ts:44`. This walks from each framing sentence
      up through every element around it, and requires no muted ink, no colour other than
      `--foreground`, and no background fill.
  - **What breaks it.** Greying the framing note into a footnote, putting it behind a
    disclosure, or tinting its panel.
- **Found-nothing is not an error.**
  - When an MLS search finds no closings, the screen shows a neutral status line and the
    upload path, never red text, an alert or "sorry".
  - **Enforced by.** `signup.test.ts:54`.
- **Plain language in what homeowners and agents read about a home.**
  - The email body and the call-list sentences may not use: reconveyed, reconveyance,
    recorded transfer, grant deed, assessed value, base year, parcel, portability, deed
    prices, title officer, tax cap.
  - The one exception is inside the email's recorder-stamp block, which quotes the
    record.
  - **Enforced by.** `src/digest/plain-language.test.ts:26` and
    `src/signals/plain-language.test.ts:19`.
- **No invented metrics.**
  - Only the statuses the database defines appear: matched, needs review, no parcel,
    unsubscribed. There are no engagement labels ("Opening", "Never opened", "Quiet",
    "May have moved"), no open-rate percentages, no stat cards, no counters, no progress
    bars.
  - **Enforced by.**
    - `people-ui.test.ts:162`, an allowlist of the words in the status cell.
    - `call-list.test.ts:88` (no stat cards, counters, `%` or progress bars on the
      dashboard).
    - `call-list.test.ts:78`: the dashboard is send status, call list, homeowners, in
      that order, and nothing else.
- **Domain rules** (CLAUDE.md, and `scripts/check-invariants.mjs` for some). A designer
  may not add:
  - a loan payoff balance
  - a home value estimate or range
  - any sentence telling a homeowner they qualify for a tax benefit
  - a figure that combines a recorded price with an MLS price

  Recorded figures carry a document number. MLS figures carry a status and a date.
- **Every MLS-sourced block shows its attribution.** "Listing courtesy of …" appears on
  every MLS listing, previews and samples included. **Enforced by.**
  `signup.test.ts:71` (every closing on the start screen) and the email's own tests
  (`04-email.md`).
- **Never show a password, a demo login or any credential on any page.** The export
  printed a demo password on its sign-in page. Not enforced by a test.
- **Marketing copy may not claim behaviour the product does not have.** The export's
  "Three past clients… We tell you which three" promised clients. See
  `03-screens/marketing.md`. Not enforced by a test.

---

## 5. Type and fonts

- **Inter everywhere. Fraunces only on the marketing home page's `<h1>`.** The serif is
  one display moment on the one page that is selling rather than working.
- **Enforced by.**
  - `src/app/design-scope.test.ts:31`, an allowlist of the four files in the whole source
    tree that may name Fraunces.
  - `src/app/marketing.test.ts:31` (the `<h1>` is the only serif element on the page).
- **What breaks it.** A serif heading in the app, or on login or register, which are the
  product's front door, not marketing. A serif heading in the shared email-preview panel
  would leak into the app.
- **The email has its own fonts** (Georgia-style serif body, 12px stamp labels), and app
  tokens must never reach it: `design-scope.test.ts:39`. See `04-email.md`.

## 6. Focus

- **Rule.** Every interactive element shows a visible focus ring: a 2px outline offset by
  2px, in `--foreground`. Every shared class carries it.
- **Why.** Keyboard and switch users, and anyone using a phone with a keyboard. The
  export's focus halo was 2.16:1.
- **Enforced by.** Only in part:
  - The shared classes carry it.
  - `review-ui.test.ts:68` requires it on the review screens.
  - No test checks focus across the whole app, and the browser pass does not tab through
    screens. A redesign that removes `focus-visible:outline` from a one-off control would
    pass.

## 7. Motion

- **Rule.** Respect `prefers-reduced-motion`. `src/app/globals.css` cuts every animation
  and transition to near zero when it is set. There is almost no motion in the app today:
  the add-on switch and the email preview's resize.
- **Enforced by.** Only `src/app/digest/preview-panel.test.ts` checks
  `motion-reduce:transition-none` on the preview. Nothing else is tested. The global CSS
  rule is the backstop.
- **What to avoid.** Count-up numbers, parallax, scroll reveals, auto-playing anything.
  The export's marketing had all four.

## 8. Things that look like design but are product decisions

Ask before changing any of these. Each is held by a test named above.

- The top bar is three visible links, not a menu icon (`top-bar.test.ts:4`).
- People shows name, address and status only (`people-ui.test.ts:8`).
- The bulk bar exists only while something is selected (`people-ui.test.ts:52`).
- Groups live on the People page and are optional (`people-ui.test.ts:63`).
- A paused account still sees its call list, below the notice (`call-list.test.ts:142`).
- Billing never uses Stripe's hosted customer portal (`billing-ui.test.ts:40`).
