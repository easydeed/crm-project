# OR-040 — Audit of the Claude design handoff (app interior)

Audited: `docs/claude-design/design_handoff_app_interior/`, merged in PR #56. No file under
`src/` was changed.

Evidence is cited in three forms:

- `D:<line>` is a line of `App Screens v2.dc.html`.
- `README:<line>` is a line of the handoff's README.
- Measurements were taken by rendering the artboards in Chromium and running the rules of
  `e2e/checks.ts` on each one. The script and its output are described in §4.

## Bottom line

This is a much better handoff than v0, and most of what it gets right came from the spec:

- It kept the delete button's style.
- It kept the cancel screen exactly.
- It kept the MLS framing sentences in full ink.
- It put "Listing courtesy of …" on every closing.
- It made "This one" the only chooser.
- It set Inter everywhere in the app.
- It drew 48px controls with no opacity.
- It fixed four of the six small standalone links from the twelfth finding.

The v0 export would have passed 3 of 75 markup tests. Built as drawn, this design fails about
16 tests and 4 browser checks, listed in §3 and §4. Half of the test failures are tests that
pin an exact class string, where the property the test protects survives.

What remains is a smaller set of real violations, and they cluster in three places:

1. **Dark mode does not exist in this design.**
   - It adds a navy top bar, a navy bulk bar, a brass total and a muted footnote on navy,
     with no dark values for any of them.
   - Built on our tokens, the bill bar's brass total would be **1.89:1** in dark mode and
     the footnote **1.36:1**.
   - The README calls the navy "`--foreground`", and `--foreground` is `#ededed` in dark.
   - This is the same class of bug as OR-037's 1.17:1 preview.
2. **Demo content that breaks domain rules.** The designer wrote sample sentences instead
   of using the product's own.
   - The call row puts an MLS listing under "On the record": "1187 Oakdale Ave listed at
     $1,065,000, active since October 2." (D:857).
   - The email preview puts a recorded price beside a street figure in one sentence: "You
     bought in 2019 for $712,000. Homes on Oakdale have recently sold for about
     $1,040,000." (D:746).
3. **Fixed copy changed anyway.** Three strings marked **Fixed** in `docs/ui-spec` were
   reworded or removed:
   - "Saved. We re-checked the address."
   - "Moved? Tell us where and we'll switch to your new home."
   - "Remove from group"

On the handoff document itself: where `01-constraints.md` stated a rule plainly with a test
named, the design kept it. Where the rule was descriptive, or described a mechanism (the
iframe, the flipping `--foreground`), the design generalised past it. §7 has the detail.

---

## 1. What it is

**Form.** The handoff is:

- A written spec, `README.md`, 216 lines. It defines tokens, type, spacing, controls,
  shared chrome, per-screen notes and behaviour.
- One HTML canvas of 20 static artboards, `App Screens v2.dc.html` (135 KB). The markup has
  inline styles, and each artboard is labelled `data-screen-label`. It needs `support.js`
  plus React from unpkg to render as a canvas. The artboards themselves are plain HTML.
- Two reference files: `Landing Page v6.dc.html` (marketing) and `Signal Colors.dc.html`
  (tag colours).
- 20 PNG screenshots at 2×.
- `SkinHandOff.zip`, a byte-for-byte duplicate of the folder: 25 files, same sizes.

There is no production code and no token file. The README says "Do not copy its markup",
and that the tests win where they disagree (README:7).

**Screens covered.**

| Screen | 1440 | 390 |
|---|---|---|
| Dashboard | Drawn | Drawn (call row open) |
| People | Drawn | Drawn (bulk bar) |
| Person | Drawn | Drawn |
| Edit person | Not drawn | Drawn |
| Review queue | Drawn | Drawn |
| Import | Drawn (empty) | Drawn (paste and mapping) |
| Start | Drawn (found) | Not drawn |
| Add-ons | Drawn | Not drawn |
| Settings | Drawn | Not drawn |
| Billing | Drawn | Not drawn |
| Cancel | Drawn | Not drawn |
| Sign in | Not drawn | Drawn |
| Create your account | Not drawn | Drawn |
| Unsubscribe | Drawn (stopped) | Drawn (subscribed) |

Some screens are not covered at all:

- the per-person review entry
- marketing `/` and `/sample` (the landing file is "reference only")
- every non-populated state on every screen: empty, loading, error, paused, system-paused,
  view-as, quiet month, undo, the done states, found-nothing, malformed, and the import
  result

The README says "Navigation, actions and states are unchanged" (README:190), but none of
those states is drawn.

**Visual or structural.** It is billed as a re-skin (README:3, :190), but it changes
structure in about 25 places, including:

- A new identity line under the bar, "Dana Whitfield · Coastline Realty" (D:580).
- Every grouping becomes a panel with a `--surface` header strip.
- `<dl>`s become `<div>` grids (Billing).
- The Settings preview moves out of its form into a sticky page column.
- The email preview is drawn inline rather than as an iframe.
- The bulk bar loses "Remove from group".
- The person page loses "Manage groups".
- "Preview it" and "Skip this month" swap emphasis.
- The import page gains a back link and a "Choose a file" label.
- Unsubscribe gains two `<h2>`s and splits a fixed sentence.

Each one is listed under its screen in §3 and §6.

---

## 2. Against `01-constraints.md`, item by item

**Respects** means the design keeps the rule. **Violates** quotes the breach. **Silent**
means the design doesn't draw the case.

| § | Constraint | Verdict | Evidence |
|---|---|---|---|
| 1.1 | No horizontal scroll at 390 | **Respects** | No artboard at 390 overflows: measured `scrollWidth` equals width on all 9 phone artboards. Long emails wrap (`overflow-wrap:anywhere`). |
| 1.2 | 44px tap targets; inline links exempt | **Violates** | Dashboard 390, call panel: the `tel:` link "909-555-1200" is 96×26 and the `mailto:` "m.okafor@gmail.com" is 150×26 (D:854-855). Each stands alone in a table cell. Today they carry `.tap`. People 390: each row's checkbox label is **34×44**, so its smaller side is 34. README:77 says "the row label supplies the 44px target", but the drawn label wraps only the box. People 390: the row name link is 24px tall and "Edit" is 25×17. Both stand alone, so the rule applies (§4). |
| 1.3 | No text under 15px | **Violates (conditionally)** | The email preview's eyebrow and attribution are 12px: "About 1142 Oakdale Ave" and "Listing courtesy of Hill Realty / Sam Ortiz." on Person and Settings (D:743-747, D:418-428). They are exempt only inside the iframe, and the design draws them inline. README:50 claims the exemption "because it mirrors the sent email". |
| 1.4 | What the browser pass doesn't see | Silent | No dark artboards; no states other than populated. |
| 2.1 | Tokens and listed pairs only | **Violates** | New hex colours: navy bar `#0e1729` used as a literal, `#c9d2e0` as a redefined `--rule`, brass `#d4a84b`, `#c7cdd8`, hover `#1f44cc` and `#1a2440`, and hover `rgba(255,255,255,.12)` (README:89, :192). `--blue` text on `--surface`: the blue step numerals on the Start strips (D:88, :116) and the blue "Edit" on a selected People row (D:617, :945). That pair is checked only as non-text (4.73:1). |
| 2.2 | Pairs with no headroom | **Respects, with one risk** | "You gave us:" puts `--muted-ink` on `--surface`, 4.56:1, the tightest pair (D:775, :1081). Still on a checked pair. |
| 2.3 | Never blue text on `--blue-soft` | **Violates** | The current People filter "All (51)" renders `#2f5bff` on `#e7edff`, **4.42:1** (D:599, :929). The chip sets no colour and inherits the design's global `a{color:#2f5bff}`. This also contradicts README:31 ("ink text on it"). |
| 2.4 | Fill vs text colours | **Respects** | Words use `#b42d17` and `#087552` (`--coral-text`, `--green-text`). The README renames them `--rust` and `--green` (README:32-33). See §5. |
| 2.5 | `--rule` decorative, `--border` for controls; no swap fainter | **Violates (one case)** | The add-on switch's off state is drawn in `--border` (D:465). Today it is `border-foreground` with a foreground knob (`addon-switch.tsx:27,30`), so off is now fainter. The import tabs are outlined in `--rule` (D:50). Review cards keep `--border`: respected. |
| 2.6 | Colour never carries meaning alone | **Respects** | Every chip has words. Unticked closings tint to `--surface`, and the checkbox still carries the state. |
| 2.7 | Dark mode: every token has a dark value | **Violates** | No dark value for anything new or changed: brass, on-navy-muted, navy-rule, the darker `--rule`, the hover colours, and the navy chrome. No dark artboard. §5 has the ratios. |
| 3.1 | Never opacity | **Violates (spec text)** | README:191: "If you add motion: 160ms ease-out height/opacity". The artboards themselves set no opacity. A hidden file input drawn at 1×1 (D:57) must be `sr-only`, not `opacity-0`. |
| 3.2 | Disabled look | **Respects** | README:74 matches `disabledClass` exactly. The People bulk bar's disabled select and "Add to group" follow it. |
| 3.3 | Off ≠ unavailable | **Respects in the row; see 2.5 for the switch** | Title, blurb and price are styled identically on and off (D:458-478). |
| 3.4 | Four states | **Silent** | No loading, empty or error state is drawn on any screen. README:190 says states are unchanged. |
| 3.5 | Shared styles | **Violates (by proposal)** | README:75 changes the text link to 17px blue, and README:71 the primary to 48px 17px/600. These are changes to `linkClass` and `buttonClass` themselves, which is the right place, but the blue link creates the §2.3 failure above. The bulk bar's inverse "Export" button is a style outside the shared set. |
| 3.6 | Delete confirms, with the fixed question | **Silent** | The Delete buttons are drawn in exactly the `destructiveButtonClass` look (D:665, :694, :973, :1023). No confirmation is drawn (a static mock can't show `window.confirm`), and the README never mentions it (no "confirm" anywhere in it). It isn't removed, but it isn't protected either. |
| 3.7 | Five-second undo | **Silent** | Not drawn on the call list or the review queue. |
| 3.8 | Call panel inline | **Respects** | Expands in place, "Close" plus `aria-expanded` (D:851). |
| 3.9 | Only "This one" picks | **Respects** | The `<li>` has no handler; "This one" is pinned to the card bottom (D:788). |
| 4 | Cancel offers nothing | **Respects** | Exact sentence, one form, filled "Cancel my plan", plain "Keep my plan" link (D:536-563). |
| 4 | MLS framing at full contrast | **Respects** | `intro` (D:84) and `listingSideNote` (D:99) appear verbatim, in ink, with no filled ancestor. `fewNote`, `nothing` and `addedLine` are not drawn. |
| 4 | Found-nothing not an error | **Silent** | Not drawn. |
| 4 | Plain language | **Respects** | None of the banned words appear in app copy. "APN 8381-012-004" on the person page (D:712) is a record identifier, not banned wording. |
| 4 | No invented metrics | **Respects in the app; violated in the reference file** | App: the chip counts "(51)/(44)/(6)/(1)" are today's format (`people-filters.tsx:49`). Landing reference: "Reading it closely / Opened your last three. Clicked the tax part twice." (Landing:173-174) is an invented engagement signal. |
| 4 | Domain rules (recorded vs MLS) | **Violates** | D:857: "On the record: 1187 Oakdale Ave listed at $1,065,000, active since October 2." puts an MLS listing under the recorded block, with no `MlsAttribution`. D:847: "1187 Oakdale Ave just listed. Four doors down." under the "Big sale next door" tag turns a recorded sale into a listing. D:746: "You bought in 2019 for $712,000. Homes on Oakdale have recently sold for about $1,040,000." puts a recorded price, with no document number, and a street figure in one sentence. |
| 4 | MLS attribution everywhere | **Violates (D:857)**; respects on Start | Every Start row carries "Listing courtesy of …" in ink at 15px (D:101-105). |
| 4 | No credential on any page | **Violates as drawn** | Sign in is drawn prefilled with `value="dana@coastlinerealty.com"` and `value="••••••••••"` (D:230-231). It isn't the seed login, but it must not be built as defaults. |
| 4 | Marketing claims | **Violates (reference file)** | Landing:48: "…past clients … tells you which three of them to call". Landing:333: "Text my clients +$9/mo … soon", an unbuilt feature with a typed-in price. Landing:297: "Not in yours yet? We'll tell you at signup.", but no county check exists in `src`. |
| 5 | Inter everywhere; Fraunces only on the home h1 | **Violates (minor)** | The paste textarea is IBM Plex Mono (README:155; D:166). README:204 offers "Google Fonts" for Inter, and `design-scope.test.ts:51` forbids that. The landing and signal files use Archivo 900 from Google Fonts. |
| 6 | Visible focus rings | **Violates (by omission and one conflict)** | No focus states are drawn. README:193 keeps the "2px `--foreground` outline", which is navy on the navy bar and the navy bulk bar: invisible. |
| 7 | Reduced motion | **Respects** | README:191 says "respect `prefers-reduced-motion`". |
| 8 | Product decisions | **Mostly respects** | Three links, not a menu (D:575). The bulk bar only appears with a selection. Groups live on People. No customer portal. But see "Remove from group" and "Manage groups" in §3. |

---

## 3. Against the tests

This covers every markup and copy test that asserts on a drawn screen, judged on the design
built as drawn.

- **FAIL (property)**: the design breaks what the test protects.
- **FAIL (pinned)**: the test pins an exact class string or whitespace. The protected
  property survives, but the test goes red as written.

### Failing

| # | Test | Kind | Why |
|---|---|---|---|
| 1 | `src/app/app/top-bar.test.ts:24`, "the current page is marked, with dark text on blue-soft…" | Property, by design choice | The current page becomes a white pill on navy (D:575), not `bg-blue-soft`. |
| 2 | `src/app/app/people/people-ui.test.ts:52`, "bulk bar is only rendered when a selection exists" | **Property** | "Remove from group" is gone from both bulk bars. The design has no occurrence of the string, and the bar is the only place to remove someone from a group (people.md:68). Also `sticky bottom-0` becomes fixed (README:115). |
| 3 | `people-ui.test.ts:93`, "edit form pre-fills every field and names the rematch save" | **Property (Fixed copy)** | `Saved. We re-checked the address.` becomes a green "Saved" chip plus "We re-checked the address." (D:212). |
| 4 | `people-ui.test.ts:155`, "the current filter is marked like the top bar…" | **Property** | Blue on blue-soft, 4.42:1 (D:599). The exact `currentClass` string also changes. |
| 5 | `people-ui.test.ts:8`, "list columns are name, address, and status only" | Pinned | Desktop draws a 4-column grid, `auto/1fr/auto/auto` (D:608), and drops the `text-right` status wrapper. It passes if added as an `sm:` variant. |
| 6 | `people-ui.test.ts:162`, "the status column says only the schema status…" | Pinned, with a property risk | It slices from `<p className="text-right">`. The design's bare status `<span>` removes that slice, so the test finds no words. |
| 7 | `src/app/app/people/review/review-ui.test.ts:94`, "candidate cards are outlined in --border…" | Pinned | `--border` is kept, at 2px, 12px radius, with a header strip (D:781). The exact class string changes. |
| 8 | `src/app/app/start/start-reskin.test.ts:54`, "…the drop zone edge is --border…" | Pinned | The drop zone keeps a dashed `--border` edge, at 2px with 32/24 padding (D:55). |
| 9 | `src/app/app/addons/addons-ui.test.ts:70`, "the bill bar is the inverted pair at full strength" | **Property and pinned** | A brass total and an on-navy-muted footnote break "full strength" (D:481-488). Radius and padding change the pinned string. |
| 10 | `src/app/tokens.test.ts:65`, "every colour token has a light and a dark value" | **Property** | Brass, `--on-navy-muted` and `--navy-rule` are proposed as tokens (README:34-36) with no dark values. |
| 11 | `src/app/design-debt.test.ts:113`, "all of src/app is tokens only" | **Property** | Hover `rgba(255,255,255,.12)`, hover `#1f44cc`/`#1a2440`, and any of the README's hex values used literally. The navy bar and the brass are literal hex in the artboards. |
| 12 | `src/app/digest/preview-panel.test.ts:6`, "preview frame is sandboxed…" | **Property** | The preview is drawn as an inline `<div title="Email preview">` (D:743, D:418), not a sandboxed iframe. |
| 13 | `src/app/sweep.test.ts:19`, "…the toggles are outlined like controls" | Property | Unselected preview toggles lose `border border-border`; the group gets one wrapper outline instead (D:409-416). |
| 14 | `src/app/app/settings/settings-ui.test.ts:8`, "settings loads a live preview beside how the email looks" | Structural | The preview moves to a page-level sticky column (D:351, :404). The test needs it inside `appearance-form.tsx`. |
| 15 | `src/unsubscribe/unsubscribe.test.ts:62`, "the page shows the house and only the scopes that are still on" | **Property (Fixed copy)** | `Moved? Tell us where and we'll switch to your new home.` is split into an `<h2>` "Moved?" and a `<p>` (D:280-282). Line 69 asserts the whole sentence. |
| 16 | `src/app/app/settings/settings-reskin.test.ts:16`, "the cancel screen carries out the decision with the primary button…" | Pinned (whitespace), **likely** | The test matches exact indentation. The new panel wrapper re-indents the JSX. The behaviour is respected. |

### Unclear (not drawn, or depends on build choices)

- `people-ui.test.ts:120` and `:145`: the delete sentence and `window.confirm`. Neither is
  drawn, and the README is silent on both.
- `call-list.test.ts:94`, `:115` and `:131`: the quiet line, undo, and "Not now". Not drawn.
- `review-ui.test.ts:54`, `:61` and `:68`: undo, the four states, and focus rings. Not
  drawn.
- `signup.test.ts:54` and `:64`: found-nothing and malformed. Not drawn.
- `start-reskin.test.ts:44` (×5): **passes** for `intro` and `listingSideNote` as drawn. It
  **fails** if README:17's "white body" is built as `bg-background` on a panel around a
  framing sentence, because the test forbids any `bg-` fill on an ancestor.
- `disabled-state.test.ts:19` fails if the hidden file input is built with `opacity-0`.
- `design-scope.test.ts:51` fails if Inter is taken "from Google Fonts" (README:204).

### Passing as drawn, assuming the shared classes are kept

- `call-list.test.ts`: :29-62, :65, :72, :78, :88, :102, :125, :142, :148, :155.
  - The "Taxes worth a talk" tag is drawn ink on blue-soft, which is correct.
  - :88 passes only because its regex doesn't match `{i + 1}` numerals. See §7.
- `people-ui.test.ts`: :24, :29, :44, :63, :71, :104, :113, :129.
- `review-ui.test.ts`: :8, :17, :37, :45, :86, :101, :109.
- `addons-ui.test.ts`: :21, :34, :42, :55, :64, :76, :82, :88.
- `billing-ui.test.ts`: :10, :29, :40.
- `settings-ui.test.ts:27`.
- `settings-reskin.test.ts`: :9, :23, :30.
- `auth-reskin.test.ts`: :8, :16.
- `sweep.test.ts`: :8, :12.
- `disabled-state.test.ts`: :28, :43, :59.
- `shared-classes.test.ts`: :30, :39.
- `signup.test.ts`: :71 (with `<MlsAttribution>`), :88.
- `marketing.test.ts`: both tests (marketing not drawn).
- `design-scope.test.ts:31`: the app uses no Fraunces.
- `unsubscribe.test.ts`: :15, :34, :92, :106, :117.
- `preview-panel.test.ts:22`.

---

## 4. Against the browser checks

**Method.** The artboards were rendered in the pre-installed Chromium from a copy with the
`support.js` canvas wrapper removed. Each `[data-screen-label]` artboard was then run through
the rules of `e2e/checks.ts`:

- tap-44: smaller dimension under 44px; a checkbox is measured by its label
- text-15
- no-horizontal-scroll and no-clipping

Each small tappable was judged twice:

- **as the check works today**: inline if its nearest block holds other text
  (`e2e/checks.ts:34-40`)
- **as the rule is written** (`01-constraints.md` §1.2): inline only if the link sits in a
  sentence, sharing its parent with a text node

Desktop artboards are listed for completeness; tap size is a phone rule.

| Artboard | Element | Size | Check today | Rule as written |
|---|---|---|---|---|
| Dashboard 390 | `tel:` "909-555-1200" | 96×26 | **FAIL** | **FAIL** |
| Dashboard 390 | `mailto:` "m.okafor@gmail.com" | 150×26 | **FAIL** | **FAIL** |
| People 390 (×5 rows) | row checkbox label | 34×44 | **FAIL** | **FAIL** |
| People 390 (×5 rows) | name link, e.g. "Aisha Rahman" | 164×24 | passes (exempt) | **FAIL**: standalone |
| People 390 (×5 rows) | "Edit" | 25×17 | passes (exempt) | **FAIL**: standalone |
| Import desktop, Start desktop | hidden file input | 1×1 | passes only if `sr-only` | same |
| Billing desktop (×2) | "View invoice" | 90×20 | n/a (desktop); exempt | standalone; would fail on a phone |
| People desktop (×6) | name link 415×24, "Edit" 25×17, checkbox 22×22 | | n/a (desktop) | |

**Where the two answers differ.** On People at 390, the name link and "Edit" pass the
current check and fail the written rule. That is the twelfth finding reappearing in the new
design. It does not affect the six links measured in OR-039: the design makes "Keep my
plan", "Create an account", "Sign in" and the Billing back link 44px. ("Back" on `/sample`
and the home button are not drawn.)

**Text under 15px** (12px, both inside the inline email preview):

- Person (390 and 1440): "About 1142 Oakdale Ave" and "Listing courtesy of Hill Realty /
  Sam Ortiz."
- Settings: the same two strings.

Exempt only if the preview stays the real iframe (§1.3).

**Horizontal scroll at 390.** None on any of the 9 phone artboards.

**Opacity.** The artboards set none. A disabled `<select>` measured 0.7 in the unstyled
design file; that is Chromium's default. In the real app it measures 1 (checked on the
`people-bulk-bar` screen: both disabled selects report `opacity=1`), because Tailwind's base
styles reset it. It is not a finding.

---

## 5. Contrast

All ratios are WCAG, computed from the hex values. "Dark" assumes the design is built on our
tokens as the README says: "`--foreground` — ink, navy bars, primary buttons" (README:25).

| Pair (as drawn) | Light | Dark (on our tokens) | Floor | Verdict |
|---|---|---|---|---|
| White text on navy bar `#0e1729` | 17.90 | literal white on `--foreground` `#ededed`: **1.17** | 4.5 | **Fails in dark** unless built `text-background` on `bg-foreground` (16.91) |
| Current nav pill: ink on white | 17.90 | `--foreground` `#ededed` on a literal white pill: **1.17** | 4.5 | **Fails in dark** unless the pill is `bg-background` |
| Brass `#d4a84b` on navy | 8.10 | on `#ededed`: **1.89** | 4.5 | **Fails in dark**; no dark value given |
| On-navy-muted `#c7cdd8` on navy | 11.21 | on `#ededed`: **1.36** | 4.5 | **Fails in dark**; no dark value |
| Navy-rule `#6b7487` on navy | 3.81 | on `#ededed`: 4.01 | 3 (non-text) | Passes, but no dark value is defined |
| `--blue` on `--blue-soft` ("All (51)") | **4.42** | 5.94 | 4.5 | **Fails in light** |
| `--blue` on `--surface` (Start numerals, Edit on a selected row) | 4.73 | 6.58 | 4.5 | Passes numerically. It is not a text pair in `tokens.test.ts`. |
| `--muted-ink` on `--surface` (table labels, "You gave us:") | 4.56 | 6.81 | 4.5 | On the floor |
| `--muted-ink` on white (identity line, meta) | 4.98 | 7.81 | 4.5 | Passes |
| `--blue` on white (all links, numerals) | 5.17 | 7.55 | 4.5 | Passes |
| Hover blue `#1f44cc` on white | 7.62 | none | 4.5 | **No dark value** |
| Hover primary: white on `#1a2440` | 15.33 | none | 4.5 | **No dark value** |
| Hover nav fill `rgba(255,255,255,.12)` | n/a | n/a | n/a | **Translucent**; can't be checked; contradicts README:17 "Nothing is translucent" |
| Redefined `--rule` `#c9d2e0` on white | 1.52 (old 1.29) | none | none (decorative) | **No dark value** |
| Rust `#b42d17` on rust-soft, green `#087552` on green-soft | 5.65 / 5.12 | 6.80 / 7.99 (as `--coral-text` / `--green-text`) | 4.5 | Passes, but the README renames the tokens (see below) |
| Accent swatch violet `#5b3fb8` | 7.37 on white | n/a | n/a | It is the email's accent, not an app pair (see §6) |

**The README's own ratios are partly wrong.**

- It says `--muted-ink` is "5.6:1 on white" (README:26). The real ratio is **4.98**.
- It says the on-navy-muted footnote is "9.9:1" (README:35). The real ratio is 11.21.
- Brass at 8.1:1 and blue at 5.2:1 are correct.

**Token renames.**

- README:32-33 calls `#087552` "`--green`" and `#b42d17` "`--rust`".
- In `globals.css`, `--green` is the fill `#0e9f6e`, `#087552` is `--green-text`, and
  `#b42d17` is `--coral-text`.
- Applied by name, this would repoint the fill token to the text value. It would also break
  every test that names `coral-text`:
  - `people-ui.test.ts:129`
  - `call-list.test.ts:155`
  - `tokens.test.ts` PAIRS

**Proposed tokens with no dark value:**

- brass
- `--on-navy-muted`
- `--navy-rule`
- the darker `--rule`
- both hover colours

**The view-as banner.** It is `INK_COLOR` `#0E1729` (`view-as-banner.tsx`), the same navy as
the new bar. Stacked above the bar, the banner whose job is to be "impossible to miss"
(design-debt.test.ts EXEMPT note) would merge with it.

---

## 6. Copy

Every string below that a test or `docs/ui-spec` marks **Fixed** is in bold.

| String | What the design does | Where |
|---|---|---|
| **`Saved. We re-checked the address.`** (person-edit.md:58, Fixed) | Split into a green "Saved" chip and "We re-checked the address." | D:212 |
| **`Moved? Tell us where and we'll switch to your new home.`** (unsubscribe.md:101, Fixed) | Split into an `<h2>` "Moved?" over a `<p>`, and moved above the input | D:280-282 |
| **`Remove from group`** (people.md:124, Fixed) | Removed from both bulk bars | D:657, D:968 |
| "Manage groups" link on the person page | Removed with "Groups are optional…". It is the only route from the person page to group management (person-detail.md:68). | D:720-728 |
| Call-list sentences (rendered from `src/signals/*`) | Replaced with demo sentences that change their meaning: "1187 Oakdale Ave just listed. Four doors down." (a sale becomes a listing); "The county recorded his loan as paid off." (drops "or refinanced"); "Taxed on $817,800. His street sells near $1,040,000." | D:847, :868, :878 |
| Call panel "On the record" | An MLS listing replaces the recorded deed | D:857 |
| Email preview body | Invented text, not `src/digest` output; mixes recorded and street figures | D:746, D:418-425 |
| Homeowners line, `Everyone you've closed with, the house they're matched to, and whether they get the monthly note.` | Replaced with counts: `51 people on your list. 44 are matched to a house.` That needs a new query. | D:892 |
| Add-on blurbs | `Your three names each month, texted to your own phone.` becomes `This month's three names, texted to your phone on send day.`; the lender blurb is reworded. Both are accurate, but they are rewordings. | D:460-470 |
| Register | New "Optional" suffixes on Brokerage, DRE number and Phone. These are accurate, but new, and they change accessible names. | D:256-258 |
| Settings | Swatch names become visible text, and the timezone shows "Pacific" for `America/Los_Angeles`. | D:380-398 |
| Unsubscribe | New "Done with these?" `<h2>` and a "Stopped" chip. The address input drops `autocomplete="street-address"`. | D:289-320 |
| Import | New `← Back to your people` and `Choose a file`. | D:43, :57 |

**Kept exactly:**

- The cancel sentence, "Cancel my plan" and "Keep my plan"
- Both MLS framing sentences that are drawn
- "Listing courtesy of …" on every closing
- The review header `Needs a look · 1 of 7`
- The dashboard sentence `Your next email goes out … to 44 homeowners.` (`src/jobs/schedule-time.ts:113`)
- `PLAN_LINE`
- "At least 10 characters"
- "Sign in" and "Create your account"
- "Contact us to change your email."
- "Plan, card, invoices, and canceling"
- "Update my address", "Stop these emails", "These emails have stopped." and "Actually, keep them coming"

**The delete confirmation.** It is not drawn and not mentioned. The sentence is neither
reworded nor removed. It is undefended. See §7.

**Not copy, but a data change.** The accent swatches change value:

| Swatch | Today | Design |
|---|---|---|
| green | `#2F5D50` | `#0E9F6E` |
| rust | `#B4532A` | `#B42D17` |
| violet | `#6B4EBF` | `#5B3FB8` |

Blue and ink are unchanged (`src/config/settings.ts:3-9`, D:380-386). An account that saved
an old value would show no selected swatch. Its next appearance save would post no accent,
and `save.ts` would write `null`, silently resetting the email's colour. This also changes
the email's design, which is out of scope (`04-email.md`).

---

## 7. Did the constraints document work?

Each violation is listed with how `docs/ui-spec` covered it:

- **Clearly**: the rule is stated with its test.
- **Ambiguously**: stated, but the design could reasonably read past it.
- **Not at all**.

| Violation | Coverage | What the doc said, and what to change |
|---|---|---|
| tel/mailto at 26px; checkbox label 34px; standalone row links | **Clearly** (§1.2, with the exemption caveat added in OR-039) | The designer read the 44px rule, drew 48px controls everywhere, and missed links inside a nested table. The doc doesn't list "links inside table cells and panels" as standalone. Add one sentence and an example. |
| 12px text in the inline email preview | **Ambiguously** (§1.3) | The doc says the email "shown inside an iframe" is not measured. The designer kept the reason ("it's the email") and dropped the mechanism (the iframe). Say "Exempt because it's an iframe. Draw the preview as a frame you don't style." |
| Email preview drawn and restyled inline | **Clearly** (`04-email.md`: out of scope; settings.md: a hard-coded sample was rejected) | Stated in two places and still done. The handoff format may be the cause: an artboard can't embed the real render. Ask for a grey "email renders here" placeholder in future. |
| New hex colours, rgba hover, no dark values | **Clearly** (§2.1, §2.7) | Stated and not followed. Neither the doc nor the brief asked for **dark artboards**. A rule with no deliverable attached was skipped. Require a dark artboard per screen in the next brief. |
| Navy surfaces: `--foreground` flips to `#ededed` in dark | **Ambiguously** (02-system lists both values; nothing warns about it) | The README calls navy "`--foreground`". The doc never says "`--foreground` is light in dark mode, so a `--foreground` surface becomes a light surface". Add it to §2.7, with brass on `#ededed` at 1.89:1 as the worked example. |
| Blue on blue-soft (current filter chip) | **Clearly** (§2.3) | The README even says "ink text on it". The violation came from the artboard's global `a{color}` rule, not a decision. The doc covered it; the designer's tooling didn't apply it. No doc change needed. Note in the next brief that links inherit colour. |
| `--blue` text on `--surface` | **Ambiguously** (§2.1 says only listed pairs; 02-system lists blue on surface as non-text) | Numerically it passes (4.73). Either add `['blue', 'surface', TEXT]` to PAIRS, or state in 02-system that `--blue` is never text on `--surface`. |
| Off switch fainter | **Ambiguously** (§2.5 "a swap must not make something fainter"; §3.3 exempts the switch from the row comparison) | Add: "the switch itself keeps its off-state ink". |
| Bill bar muted footnote and brass | **Not at all** in `01` (only in addons.md and the test name "full strength") | Add the bill bar to §3.3, or to a new "inverted surfaces" rule: full strength, checked pairs only. |
| Focus ring invisible on navy | **Ambiguously** (§6 says "in `--foreground`" without anticipating dark surfaces) | Change §6 to "a ring that clears 3:1 against the surface it sits on". |
| View-as banner merges with a navy bar | **Not at all** | Add it to §8: the banner's colour is reserved, and no other chrome may use `INK_COLOR`. |
| MLS figure under "On the record"; recorded and street figures in one sentence | **Clearly** for product copy (§4 domain rules); **not at all** for demo content | The designer obeyed the rules in the real copy and broke them in invented sample text. Add: "Sample content must be the product's own output. Use `fullDigest()` and the seed, never invented sentences." |
| Call-list sentences rewritten | **Ambiguously** | They are not quoted as Fixed in dashboard.md, because they are templates in `src/signals`. Mark the templates Fixed, with their source file. |
| Fixed strings changed: "Saved. We re-checked the address.", "Moved? …", "Remove from group" | **Clearly** (marked **Fixed** in person-edit.md:58, unsubscribe.md:101, people.md:124) | Stated and not followed. All three are splits or removals, not rewordings: a chip plus a sentence, a heading plus a sentence, a control dropped. The doc says "may not be reworded". Say "may not be reworded, split, restyled into pieces or removed". |
| "Manage groups" dropped | **Ambiguously** (listed as a control in person-detail.md, not marked Fixed) | Mark navigation routes that are the only path somewhere as Fixed. |
| Delete confirmation not mentioned | **Clearly** (§3.6) | The design is silent rather than in violation, which is the right outcome for a static mock. But a builder working from the README alone wouldn't learn of it. Next time ask the designer to annotate behaviour that can't be drawn (confirm, undo, live regions). |
| Prefilled credentials on Sign in | **Clearly** (§4) | Demo values in a mock; the rule is about built pages. Add "including mocks". |
| 24px h1, 16px labels | **Ambiguously** (§1.3 "The app uses 15, 17, 19 and 22px" is descriptive) | Not a violation of any test. Decide whether the scale is a rule. If it is, say "only these sizes". |
| Monospace textarea; "Google Fonts" for Inter | **Clearly** in 02-system (bundled fonts) and §5 (Inter everywhere); only Fraunces is tested | Add the font allowlist to §5 by name. |
| Pinned-string test failures (7 of the 16) | **Not at all** | `01` says tests read source, but not that several pin exact class strings. A designer can't know that, and shouldn't need to. These are ours to refactor, not the designer's to avoid. |
| Landing: past clients, an engagement signal, unbuilt features | **Clearly** (§4, marketing.md) | The landing file is marked "reference only", and marketing wasn't in this brief. |

**Overall.** The document worked where it named a rule, gave the reason and the test, and
the rule could be drawn: tap size on controls, opacity, delete styling, cancel, MLS framing,
attribution, "This one", Inter. It failed in three predictable ways:

- **Mechanisms the designer can't see.** Examples are the iframe exemption and `--foreground`
  flipping in dark mode.
- **Rules with no deliverable.** Dark mode was required but no dark artboard was asked for.
  Behaviour that can't be drawn needed annotations.
- **Content the designer authored.** Sample sentences broke rules that the real templates
  keep.

---

## 8. Recommendation

**Take as is:**

- **Panels.** A `--rule` border, a 12px radius and a `--surface` header strip. This is the
  strongest idea here. It must be built with no `bg-` fill on any ancestor of a framing
  sentence (`start-reskin.test.ts:44`).
- 48px primary, secondary and input controls, and 17px body text. Change them in
  `buttonClass`, `fieldClass` and the body size, not in copies.
- Field labels above inputs at 16px/600.
- The review card layout: header strip, "This one" pinned to the bottom, a 3-column grid at
  1440.
- The import tab strip and its drop zone.
- 44px links for "Keep my plan", the cross-links and the back links. These fix four of the
  six twelfth-finding gaps.
- Register's password fix: a label plus `aria-describedby`, closing the gap noted in
  register.md.
- The cancel screen and the auth column.

**Take with changes:**

- **The navy top bar.** Build it on tokens: `bg-foreground text-background`, with a
  `bg-background text-foreground` current pill. That pair is 16.91 in dark. Its dark mode
  then becomes a light bar on a dark page, which is a design question for you.
  Separately:
  - Change the view-as banner so it can't merge with the bar.
  - Give the focus ring on the bar a ring that clears 3:1 on navy.
  - Update `top-bar.test.ts:24` deliberately: the marker changes from blue-soft to an
    inverted pill.
- **Blue links.** A system decision, as you said in OR-038. If taken:
  - Only text links go blue.
  - Filter chips and nav keep ink.
  - Add `blue` on `surface` as a text pair, or forbid it.
- **The identity line.** Fine, but "Log out" stays a form button, and view-as needs a
  defined behaviour.
- **The People desktop 4-column grid**, as an `sm:` variant. Keep the `text-right` status
  wrapper so the allowlist test still finds the cell.
- **The bill bar.** Keep it inverted at full strength: no brass, no muted footnote, unless
  each becomes a token with a dark value and a checked pair.
- **Unsubscribe panels.** Keep "Moved? Tell us where and we'll switch to your new home." as
  one sentence. Fix the `form:first-of-type` CSS trap (`html.ts:69`): sectioning makes the
  stop and undo buttons 18px bold, which contradicts the design.
- **Settings.** The preview stays the real iframe. Moving it to a page column is fine only if
  `settings-ui.test.ts:8` is rewritten on purpose.

**Refuse:**

- An inline or restyled email preview, and the 12px text with it.
- Brass, on-navy-muted, navy-rule and the hover `rgba`, unless each comes with a dark value
  and a checked pair.
- The `--rust` and `--green` renames.
- The accent swatch value changes. They change the email's design and silently reset saved
  accents.
- Removing "Remove from group" or "Manage groups".
- Splitting any **Fixed** string.
- Every demo sentence: the call-list sentences, "On the record", and the preview body.
- The homeowners count line. It is new copy and needs a new query.
- Monospace and Google-hosted fonts.
- The opacity motion in README:191.
- The landing page's claims, which are out of scope here anyway.

**Proposed packet sequence**, if you want to apply it:

1. **OR-041: the check fixes first** (no visual change).
   - Narrow the tap-44 inline exemption to links that share a parent with a text node.
   - Refactor the seven pinned-string tests to assert their property (the token, the
     pair), not the exact class string.
   - It will go red on the current six small links. That is the point; fix them in the same
     packet.
2. **OR-042: the system.**
   - Tokens: the darker `--rule`, given a dark value.
   - The shared classes: 48px controls, 17px body.
   - Panels.
   - Decide blue links here.
3. **OR-043: the chrome.**
   - The navy bar on tokens, the identity line, and Log out kept as a form.
   - The view-as banner and the focus ring on dark surfaces.
4. **OR-044 to OR-047: screens in the re-skin order.**
   - Dashboard (the real sentences)
   - People and person (keep both group controls)
   - Review, import and start
   - Settings, billing, cancel, add-ons, auth and unsubscribe

Each screen packet runs the exact desktop comparison and two deliberate breaks, as before.

**Before any of that: one question for you.** Does dark mode get a dark navy bar (a new dark
token pair), or does the bar invert to light? The design doesn't say, and every chrome
packet depends on the answer.
