# 02 — The design system

What the app is drawn with: colour tokens, type, radii, the shared styles and the fonts.
All of it lives in two files:

- `src/app/globals.css` holds the tokens, the fonts mapping and the phone tap-size rule.
- `src/app/app/people/ui.ts` holds the shared styles.

Styling is Tailwind v4 utility classes. When this file names a class such as
`bg-surface`, that means "the `--surface` token as a background".

A redesign is expected to change these values. The rules in `01-constraints.md` say which
changes are safe: any new value has to keep its pairs above their floors, in light and in
dark.

## Colour tokens

Every colour has a light and a dark value. The app follows the device's setting, and
there is no in-app theme switch.

| Token | Light | Dark | What it is for |
|---|---|---|---|
| `--background` | `#ffffff` | `#0a0a0a` | The page. |
| `--foreground` | `#0e1729` | `#ededed` | Words. Also the primary button's fill. |
| `--surface` | `#f2f5fa` | `#161b24` | A quiet fill. Used for panels, hovered rows, the disabled fill and neutral tags. Barely different from the page (1.09:1), so it never marks a boundary on its own. |
| `--rule` | `#dce3ee` | `#262d3a` | A decorative divider or card edge. Faint on purpose (1.29:1). Never the edge of something you act on. |
| `--border` | `#7c879d` | `#6b7487` | The outline of a control: inputs, outlined buttons, toggles, the drop zone, review cards. At least 3:1 on page and surface. |
| `--muted-ink` | `#63708a` | `#9aa3b5` | Secondary words. On the floor against `--surface`. |
| `--blue` | `#2f5bff` | `#7d9bff` | Not used anywhere in `src/app` today. Kept, with its pairs checked, for a future system decision. |
| `--on-blue` | `#ffffff` | `#0a0a0a` | Words on a `--blue` fill. |
| `--blue-soft` | `#e7edff` | `#1a2240` | "Current" or "selected": the current top-bar link, the current People filter, the "Taxes worth a talk" and "Name matches" tags. Words on it are `--foreground`, never `--blue`. |
| `--coral` | `#ff4a2b` | `#ff4a2b` | A coral fill or mark. 3:1 only, so never words. |
| `--coral-text` | `#b42d17` | `#ff8a75` | Coral words: "needs review", Delete, "Big sale next door". |
| `--coral-soft` | `#ffefeb` | `#3b1a14` | The tint behind coral words. |
| `--green` | `#0e9f6e` | `#0e9f6e` | A green fill or mark. 3:1 only. |
| `--green-text` | `#087552` | `#4fd6a1` | Green words: "matched" ("On the map"), "Paid off their loan". |
| `--green-soft` | `#e7f6ef` | `#0f2e22` | The tint behind green words. |

## Every checked pair, with its real ratio

These are the combinations the system allows, from `src/app/tokens.test.ts:37`. Text
pairs must clear 4.5:1 and non-text pairs 3:1, in both schemes. Headroom is the smaller of
the two ratios minus the floor. Pairs under 0.5 are in bold: they are the ones a small
change breaks.

| Pair | Floor | Light | Dark | Headroom |
|---|---|---|---|---|
| `--foreground` on `--background` | 4.5:1 | 17.90:1 | 16.91:1 | 12.41 |
| `--background` on `--foreground` | 4.5:1 | 17.90:1 | 16.91:1 | 12.41 |
| `--foreground` on `--surface` | 4.5:1 | 16.38:1 | 14.75:1 | 10.25 |
| `--foreground` on `--blue-soft` | 4.5:1 | 15.30:1 | 13.32:1 | 8.82 |
| `--foreground` on `--coral-soft` | 4.5:1 | 16.02:1 | 13.35:1 | 8.85 |
| `--foreground` on `--green-soft` | 4.5:1 | 16.05:1 | 12.51:1 | 8.01 |
| `--muted-ink` on `--background` | 4.5:1 | 4.98:1 | 7.81:1 | **0.48** |
| `--muted-ink` on `--surface` | 4.5:1 | 4.56:1 | 6.81:1 | **0.06** |
| `--blue` on `--background` | 4.5:1 | 5.17:1 | 7.55:1 | 0.67 |
| `--on-blue` on `--blue` | 4.5:1 | 5.17:1 | 7.55:1 | 0.67 |
| `--coral-text` on `--background` | 4.5:1 | 6.31:1 | 8.62:1 | 1.81 |
| `--coral-text` on `--coral-soft` | 4.5:1 | 5.65:1 | 6.80:1 | 1.15 |
| `--green-text` on `--background` | 4.5:1 | 5.71:1 | 10.81:1 | 1.21 |
| `--green-text` on `--green-soft` | 4.5:1 | 5.12:1 | 7.99:1 | 0.62 |
| `--border` on `--background` | 3:1 | 3.61:1 | 4.22:1 | 0.61 |
| `--border` on `--surface` | 3:1 | 3.31:1 | 3.68:1 | **0.31** |
| `--coral` on `--background` | 3:1 | 3.35:1 | 5.91:1 | **0.35** |
| `--coral` on `--surface` | 3:1 | 3.07:1 | 5.15:1 | **0.07** |
| `--green` on `--background` | 3:1 | 3.39:1 | 5.85:1 | **0.39** |
| `--green` on `--surface` | 3:1 | 3.10:1 | 5.10:1 | **0.10** |
| `--blue` on `--surface` | 3:1 | 4.73:1 | 6.58:1 | 1.73 |

### Combinations that are not pairs, and why

These ratios were computed the same way. None of them may carry information.

| Combination | Light | Dark | Status |
|---|---|---|---|
| `--rule` on `--background` | 1.29:1 | 1.43:1 | Decorative only. |
| `--rule` on `--surface` | 1.18:1 | 1.25:1 | Decorative only. |
| `--surface` on `--background` | 1.09:1 | 1.15:1 | A fill, never a boundary. |
| `--blue` on `--blue-soft` | 4.42:1 | 5.94:1 | **Fails** in light. Never blue words on a selected fill. |
| `--muted-ink` on `--blue-soft` | 4.26:1 | 6.15:1 | **Fails** in light. Never muted words on a selected fill. |
| `--coral` on `--coral-soft` | 3.00:1 | 4.66:1 | On the floor. Use `--coral-text`. |

## Type

**Typefaces.**

- **Inter** is used everywhere in the app, on login, on register and in the email preview's
  chrome.
- **Fraunces**, a display serif, is used only on the marketing home page's `<h1>`, at weight
  500.
- Both are bundled in `src/app/fonts/` (`fonts.ts`), with no request to Google at build or
  run time. Each covers the Latin, Latin-extended and Vietnamese character ranges, because
  agents' contact names arrive in all three; the seed includes one of each.
- Where Fraunces may appear is enforced by `src/app/design-scope.test.ts:31`.

**Sizes in use** in `src/app`, counted from the source.

| Size | Uses | Role |
|---|---|---|
| 15px | 278 | The default for everything: body, labels, links, buttons, inputs, tags. Also the smallest size allowed anywhere. |
| 17px | 13 | Body-large: the call-list sentences, add-on rows, the bill bar, settings and billing lead lines, the marketing story. |
| 18px | 18 | A section heading inside a panel or form: settings sections, the add-on bands, the email preview's title, the start screen's sections. |
| 19px | 2 | The dashboard's two section headings: the call list and homeowners. |
| 22px | 56 | The page heading (`<h1>`) on every app screen, login and register. |
| 28px | 5 | Admin only, for cost totals. Admin is unstyled by decision. |
| 32 / 40px | 1 | The marketing home `<h1>` in Fraunces: 32px on a phone, 40px from 640px up. |

**Weights.**

- `font-semibold`: headings, the wordmark, the current nav link.
- `font-medium`: emphasis within a row.
- Normal: everything else.

**Rule.** Nothing under 15px carries information (`01-constraints.md` §1.3).

## Radii, borders and shadows

- **Radii.** The scale comes from a 9px base (`globals.css` `@theme`). In use:
  - `rounded-md` (about 7px): buttons, inputs, nav links, review cards.
  - `rounded-lg` (about 9px): the dashboard send card and the call panel.
  - `rounded-full`: tags and the add-on switch.
- **Borders, not shadows.** Cards take a `--rule` border, and nothing in the app has a drop
  shadow. A shadow's contrast cannot be checked, and the export's 14 marketing shadows
  were all `rgba` ink. Any colour written as `rgba(…)` is now caught by the colour scan
  (`src/app/design-debt.test.ts:113`).
- **The exception.** Review candidate cards take `--border` (`01-constraints.md` §2.5).

## The phone tap-size rule, in CSS

Under 640px wide, `globals.css` gives every button, `[role=button]`, `<summary>`,
`<select>`, `<textarea>` and text-like `<input>` a 44px minimum height. A link that stands
on its own line takes the `.tap` class, which makes it a 44px flex box. A link inside a
sentence does not take `.tap`, and is exempt. Desktop keeps its own sizes.

A redesign can change how controls look. It must keep this floor on phones, and the
browser pass (`e2e/checks.ts:52`) measures it.

## Shared styles

Each of these is one string in `src/app/app/people/ui.ts`. Every screen uses the string by
name. **Changing one changes every screen that uses it.** That is the point: a change made
once is made everywhere, and nothing drifts. Copies of these strings are refused by
`src/app/shared-classes.test.ts`.

| Name | What it is for | What it looks like today |
|---|---|---|
| `buttonClass` | The one primary button: the action the screen exists for. One per screen where possible. | `--foreground` fill, `--background` words, 15px, `rounded-md`, 16px by 8px padding, a 2px focus outline offset 2px. Includes `disabledClass`. |
| `disabledClass` | The look of any button that will not respond. Part of `buttonClass` and `destructiveButtonClass`. | `--surface` fill, `--muted-ink` words, a 1px inset `--border` ring, not-allowed cursor. Never opacity. Only for real disabled controls, never for an "off" choice. |
| `destructiveButtonClass` | Delete, and only Delete. | Coral words (`--coral-text`) on the page background, with a `--border` outline, so it never looks like the primary button. Includes `disabledClass`. Always followed by a confirmation. |
| `linkClass` | A text link: navigation, "Back", secondary actions. | 15px, underlined (offset 4px), with the focus outline. Inherits the surrounding text colour. |
| `fieldClass` | Every text input and select. | 15px, `--border` outline, page background, `rounded-md`, block display (so its label sits above it), full width up to `max-w-sm`, with the focus outline. |
| `mutedClass` | Secondary lines: helper text and notes. | 15px, `--muted-ink`. Never for the MLS framing sentences or anything a test requires at full contrast. |
| `sendCardClass` | The dashboard's single send card: one message, at most one action. No figures, counts or tiles. | `--rule` border, `rounded-lg`, page background, with horizontal margins. |

**Not in `ui.ts`, but shared the same way:**

- Status tags (`src/app/app/people/status-tag.ts`): a `rounded-full` pill, one per contact
  status, each a checked pair.
  - matched: `--green-text` on `--green-soft`.
  - needs review: `--coral-text` on `--coral-soft`.
  - no parcel and unsubscribed: `--muted-ink` on `--surface`.
  - "Name matches": `--foreground` on `--blue-soft`. Neutral on purpose, because a name
    match is evidence about a candidate house, not an answer.
- Call tags (`src/app/app/call-tags.ts`): "Big sale next door" is coral, "Paid off their
  loan" is green, "Taxes worth a talk" is `--foreground` on `--blue-soft`, and "Been a
  while" is grey (`--muted-ink` on `--surface`).
- The top-bar link (`src/app/app/nav-link.tsx`):
  - `.tap` and 15px `--foreground`.
  - `--surface` on hover.
  - When it is the current page: `--blue-soft` with semibold words and
    `aria-current="page"`.

## Spacing and width

There is no spacing token scale beyond Tailwind's defaults.

- Screens are a single column with a 16px side gutter (`px-4`).
- Content is capped at `max-w-2xl` for most app screens, `max-w-xl` for marketing and
  `max-w-sm` for forms.
- Nothing is a multi-column dashboard. The app is built phone-first and reads the same on
  a desktop, wider.
