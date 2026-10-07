# Marketing — `/` and `/sample`

**Capture:** home (`/`), sample (`/sample`), sample-text-dark (`/sample` in dark mode with
"Plain text" pressed). All signed out, at 390 and 1440 (`e2e/screens.ts:31-47`).

## What the visitor came here to do

These are the only two pages a **prospect** sees: a real-estate agent deciding whether to sign up.
They are not signed in. (Homeowners never see these pages; theirs is `/u/[token]`.)

- `/` tells one story in six lines: one real-looking house, what similar homes on its street sold
  for, what the county taxes it on, and the yearly difference. Then it offers the sample note, the
  account, or sign-in. Code: `src/app/page.tsx` renders `HomeStory` (`src/app/home-story.tsx`).
- `/sample` shows the actual monthly email for that same house, rendered by the real email
  renderer, so the prospect reads exactly what a homeowner would receive (`src/app/sample/page.tsx`).

**One Oakdale story.** Both pages, and the email fixture behind them, read from one place:
`canonicalFacts()` and `fullDigest()` in `src/digest/canonical-facts.ts`. Both take the `full`
scenario from `src/digest/fixtures/scenarios.ts` ("the fixture"): 1142 Oakdale Ave, La Verne
91750, owner Marilyn Okafor. The home page's figures are computed by the same function the email
uses (`streetMedianSale`, `src/digest/blocks/taxes.ts:13`), not typed in. The v0 export retyped the
same figures as literals in several components, and they drifted (audit `:337`). A redesign must
keep every figure on `/` coming from `facts.*`; never type `$2,600` into the page.

The house and its numbers are a sample. They are not a home value estimate and must never be
framed as one (CLAUDE.md, "Never display a home value estimate").

## Layout

### `/` (home)

A single centred column at most 576px wide (`max-w-xl`), vertically centred in the screen, 16px
side gutter, 40px top and bottom, 24px between items (`home-story.tsx:15`). Top to bottom:

1. Wordmark `onrecord`, 15px semibold Inter, a `<p>` (`:16`). It is the same mark as on `/login`
   and `/register`, which is why it stays Inter (OR-038 Decision A).
2. `<h1>` `A note about their house, from the county record.` in **Fraunces**, weight 500,
   32px on a phone and 40px from 640px up (`font-serif text-[32px] ... sm:text-[40px]`), tracking
   -0.01em, tight leading (`:17-19`). This is the only Fraunces on the site.
3. Five 17px Inter paragraphs, relaxed leading, all --foreground; nothing on this page is muted
   (`:20-35`). See Fixed copy for the words.
4. A row of three links that wraps on a narrow screen, 16px apart (`flex flex-wrap items-center gap-4`,
   `:36-46`): `See the sample note` styled as the primary button, then `Create an account` and
   `Sign in` as text links.

The only width difference is the `<h1>` size. At 390 the link row may wrap onto two lines.

### `/sample`

A centred column at most 768px wide (`max-w-3xl`), 16px gutter, 40px top and bottom, 24px gaps
(`sample/page.tsx:9`). Top to bottom:

1. Wordmark `onrecord` (`:10`).
2. The shared preview panel (`DigestPreviewPanel`, `src/app/digest/preview-panel.tsx:91-111`), the
   same component the agent sees on a person's page and in Settings:
   - `<h2>` `A sample note for Marilyn`, 18px semibold (`preview-panel.tsx:102`, title from
     `sample/page.tsx:11`). There is no `<h1>` on `/sample`.
   - Two button pairs: `Desktop` / `Phone` and `Email` / `Plain text` (`preview-panel.tsx:51-68`).
   - The email, in a sandboxed `<iframe>` 640px tall, 600px wide for Desktop or 380px for Phone,
     never wider than the column (`max-w-full`, `:69-78`); or, in Plain text mode, a `<pre>` on the
     page background in 15px --foreground (`:79-86`).
3. `Back`, a text link to `/` (`sample/page.tsx:12-17`).

At 390 the column is 358px wide, so `max-w-full` clamps both the 600px and the 380px preview to
358px. **The `Desktop` / `Phone` toggle therefore changes nothing visible on a phone.** Read from
the code (`preview-panel.tsx:74-77, 82`); not in a capture, since every capture uses the default.
This brushes against invariant 1 ("no dead controls"); no test covers it.

The email inside the iframe has its own design (Georgia, its own ink, 12px labels). It is exempt
from the app's 15px and token rules because it is an email (`e2e/checks.ts:12`;
`design-scope.test.ts:39`). Its MLS block carries its attribution line inside the email
(`src/digest/blocks/four-doors.ts:34-44`), in both HTML and plain text, so invariant 9 holds on
the sample page.

## Controls

| Label (quoted) | What it does | Disabled look | Where focus goes after |
|---|---|---|---|
| `See the sample note` (`home-story.tsx:37-39`) | Link to `/sample`, styled with `buttonClass` (dark fill, light 15px text) plus `inline-block`. | Never disabled. | Navigation. |
| `Create an account` (`home-story.tsx:40-42`) | Text link (`linkClass`) to `/register`. | Never. | Navigation. |
| `Sign in` (`home-story.tsx:43-45`) | Text link to `/login`. | Never. | Navigation. |
| `Desktop` / `Phone` (`preview-panel.tsx:51-59`) | Sets the preview width to 600 or 380px. A group labelled `Preview size` for screen readers. The pressed one is filled (--foreground fill, --background text); the other is outlined in --border. `aria-pressed` reports which. | Never. | Stays on the pressed button; no `focus()` call. |
| `Email` / `Plain text` (`preview-panel.tsx:60-68`) | Switches between the rendered email and its plain-text version. Group `Preview format`. | Never. | Stays on the button. |
| `Back` (`sample/page.tsx:12-17`) | Text link to `/`. | Never. | Navigation. |

The CTA is a link, not a `<button>`, so the phone rule that makes controls 44px tall
(`src/app/globals.css:106-114`) does not reach it, and it has no `.tap` class. See the 44px note
under Tests.

## States

| State | What renders | Source |
|---|---|---|
| `/` populated | Everything above. | Captured: home. |
| `/` loading | No `loading.tsx` of its own; the root one: `Loading onrecord` (`src/app/loading.tsx:4`). | Described from the code. The page has no data fetch, so it is rarely if ever seen. |
| `/` error | Root `error.tsx`: `We couldn't load this page.` / `Try again in a moment.` (`src/app/error.tsx:6-7`). `canonicalFacts()` throws if the fixture lost its tax inputs or listing (`canonical-facts.ts:18-23`). | Not producible from the seed; described from the code. |
| `/` empty | None: the page reads a fixture, not the database. | — |
| `/sample` populated, Email | Panel heading, both toggles, the email. | Captured: sample. |
| `/sample` populated, Plain text, dark mode | The plain text on the page background, starting `Hi Marilyn,`. | Captured: sample-text-dark. |
| `/sample` loading | `Loading the sample note` (`src/app/sample/loading.tsx:4`). | Described from the code. |
| `/sample` error | `We couldn't load the sample.` / `Try again in a moment.` (`src/app/sample/error.tsx:6-7`). | Not producible; described from the code. |
| `/sample` skip | If the renderer decided not to send, the panel shows the reason as a 15px line and no frame (`preview-panel.tsx:104-108`). | Not producible: the `full` scenario always sends (`marketing.test.ts:21`). |

**Why sample-text-dark exists.** Until OR-037 the plain-text preview drew `#ededed` text on white
in dark mode (1.17:1), on four screens including this one (`docs/audits/reskin-screen-log.md:93-94`).
The fix put the `<pre>` on `bg-background`. The capture's `prepare` step presses `Plain text`,
checks `aria-pressed="true"`, checks the text contains `Hi Marilyn,`, and fails if the `<pre>`'s
background is white (`e2e/screens.ts:35-46`). It is there so the fix is held by a capture as well
as by `sweep.test.ts:19`.

## Fixed copy

- The home story, from `home-story.tsx:18-35`, rendered:
  `A note about their house, from the county record.` /
  `1142 Oakdale Ave, La Verne 91750. Marilyn.` /
  `Homes on Oakdale have recently sold for about $1,040,000. A buyer paying that would be taxed on it.` /
  `The county taxes this house on $817,800.` /
  `That difference is about $2,600 a year.` /
  `California lets some homeowners carry this to their next home.`
  - **Fixed (figures)**: `src/app/marketing.test.ts:10-29` holds `1142 Oakdale Ave`, `Marilyn`,
    `about $1,040,000`, `$817,800`, `about $2,600`, and that `home-story.tsx` reads `facts.benefit`.
  - The words are not held by a test, but carry product rules. They are the email's tax block
    (`taxes.ts:37-40`) restated. "A buyer paying that would be taxed on it" states a recorded fact
    instead of an estimated value; the export's version carried an "estimate" badge (audit `:145`).
    "California lets **some** homeowners carry this" states a fact without telling the reader they
    qualify (CLAUDE.md: never assert tax eligibility to a consumer; PROJECT_STATE rejects "You're a
    Prop 19 candidate"). OR-038 changed no words, and copy is Cursor's, not a re-skin's.
  - `Oakdale` is typed into `home-story.tsx:24`, while the email derives the street name from the
    address (`taxes.ts:36`). The test does not check that word.
- The `<h1>` is the only Fraunces element. **Fixed**: `marketing.test.ts:31-48` (and exactly one
  `font-serif` in the file); `design-scope.test.ts:24-37` (only four files under `src` may name it).
- `Plain text`, `Email`, `Desktop`, `Phone` and the `600` / `380` widths. **Fixed**:
  `src/app/digest/preview-panel.test.ts:6-20`. The capture also finds `Plain text` by name
  (`e2e/screens.ts:41`).
- `Hi Marilyn,` in the plain text. **Fixed**: `marketing.test.ts:24`, `e2e/screens.ts:44`.

**What the page must not claim** (invariant 5). It mentions no call list, no clients, no open
rates, no "every figure traces to a recorded document". The open question that the page does not
yet say "it tells me who to call" is recorded for Jerry (`reskin-screen-log.md:98-102`); it is a
copy decision. There is no footer, and no privacy or terms link, because those pages do not exist
(`reskin-screen-log.md:104-108`).

## Tests that assert on this screen

- `src/app/marketing.test.ts:10` — `/`, `/sample` and the fixture share one Oakdale story via `canonicalFacts` / `fullDigest`.
- `src/app/marketing.test.ts:31` — Fraunces is the home `<h1>` and nothing else on the page.
- `src/app/design-scope.test.ts:31` — whole-tree Fraunces allowlist; fails if a file is added or drops out.
- `src/app/design-scope.test.ts:39` — nothing in `src/digest` reads an app token (the email keeps its own design).
- `src/app/digest/preview-panel.test.ts:6, 22` — sandboxed iframe, toggle labels and widths, `aria-pressed`; a skip shows a reason and no empty frame.
- `src/app/sweep.test.ts:19` — the plain text sits on the page background; toggles are outlined like controls.
- `src/app/shared-classes.test.ts:30, 39` — `buttonClass` and `linkClass` are not copied.
- `src/app/design-debt.test.ts:113` — all of `src/app` is tokens only (catches the export's rgba shadows since OR-038).
- `e2e/screens.spec.ts:7-18` (home, sample, sample-text-dark, at 390 and 1440): status under 400;
  no `/couldn.t load|could not load/i` text; then `e2e/checks.ts`: no horizontal scroll (`:23-24`),
  no text under 15px outside the iframe (`:66`), no clipping (`:68-75`), 44px tap targets on the phone
  (`:40-56`).
  - 44px note: on `/` the CTA and both links, and `Back` on `/sample`, stand alone, so each is held to
    44px on a phone. All carry `.tap` since OR-041 (`e2e/checks.ts:35-37`).
- `e2e/desktop-unchanged.spec.ts` — on demand, pixel-exact at 1440.

## What the v0 export did, and why we did not take it

The export's `/` (`reference/v0-export/app/page.tsx`) is eleven marketing sections plus a header
and footer. OR-038 restyled ours in place and took no export component (audit `:438`,
`packets/OR-038-reskin-marketing.md`). Taken: Fraunces as the display face, used quietly.

| Export | Where | Why not |
|---|---|---|
| Hero `Three past clients are worth a call this month. We tell you which three.` | `components/marketing/hero.tsx:53-54` | Promises clients; MLS homes go to whoever lives there now (OR-026). New copy is a claim (invariant 5). |
| `Marilyn opened all 3` | `hero.tsx:183` | An engagement metric (invariant 8; audit `:151`). |
| `Prop 13 saves $2,600/yr` pill | `hero.tsx:22` | Reads as a consumer benefit claim. |
| Count-up proof band | `components/marketing/proof-band.tsx` | A stat band, plus motion to gate. |
| Parallax, scroll reveals, animated survey-plat background at opacity 0.14 | `hero.tsx:28-33`, `scroll-fx.tsx` | Carries nothing; opacity decoration is banned. |
| Mobile menu, tabbable when closed | `marketing-header.tsx:85-107` (audit `:242`) | A focus trap for three links. |
| Footer links to `/privacy` and `/terms`, and `href="#"` | `marketing-footer.tsx:106, 109` | Pages that do not exist; dead links (invariant 1). |
| 14 rgba ink shadows and a blue CTA glow | audit `:103` | Decoration; the token scan now catches them. |
| `/sample`: inline `<SampleEmail>` with retyped figures | audit `:230, 337` | Not the real renderer; figures drift; the email's CSS would leak and its 12px text would fall under the page's 15px rule. |
| `/sample`: h1 `This is the whole thing. Read it before you sign up.` and a fixed bottom bar `Start for $19 a month` at 13px | `app/sample/page.tsx:28-30, 39-50` | New copy; a hard-coded price; 13px; a 40px button (audit `:213`). |
| Sample modal: `Every figure traces to a recorded document.` | `sample-email-modal.tsx:96` | False: the listing figure is MLS, not recorded (audit `:155`). |
| One house shown as both a recorded sale and an MLS listing | `sample-email.tsx:43, 146-149` | Recorded and MLS figures may never be blended (audit `:154`). |
