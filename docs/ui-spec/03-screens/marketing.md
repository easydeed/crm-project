# Marketing — `/` and `/sample`

**Capture:** home (`/`), home-dark (`/` in dark mode, OR-053), sample (`/sample`), sample-text-dark
(`/sample` in dark mode with "Plain text" pressed). All signed out, at 390 and 1440 (`e2e/screens.ts`).

## What the visitor came here to do

These are the only two pages a **prospect** sees: a real-estate agent deciding whether to sign up.
They are not signed in. (Homeowners never see these pages; theirs is `/u/[token]`.)

Since OR-053 the page is built from the Claude design's `Landing Page v6.dc.html`, audited in
`docs/audits/OR-052-marketing-design-audit.md`, with the Director's decisions in its §6. It keeps
the design's direction (Archivo display type, the navy bar, cream sections, gold accents, big
type) and drops every claim the product does not keep.

**Every figure comes from code, never typed in.**

- The Oakdale house, its deed and the real email: `canonicalFacts()` and `fullDigest()` in
  `src/digest/canonical-facts.ts`, from the `full` scenario. `canonicalFacts().deed` (OR-053)
  is the grant deed the email's recorder stamp quotes: instrument, recorded date, document
  number and price. A recorded figure carries its document number.
- The sample call list in the hero: `sampleCalls()` in `src/app/marketing/sample-calls.ts` runs
  the real signal code on three signal fixtures, one per reason. Each sentence is the call list's
  own sentence for that house, so no figure is borrowed from another house, and the recorded-sale
  tag carries a sale, never a listing.
- The plan price and homeowner limit: `PLAN` in `src/config/costs.ts`. The add-ons: the
  registry (`getAddonRegistry()`), with prices from `ADDON_PRICES`.

The house and its numbers are a sample. They are not a home value estimate and must never be
framed as one (CLAUDE.md, "Never display a home value estimate").

## Layout

### `/` (home), top to bottom

Files: `src/app/home-story.tsx` composes `src/app/marketing/*`.

1. **Header, on the bar** (`site-chrome.tsx`): the `onrecord` wordmark; `Sample note` and
   `Sign in` links; `Start for $19 a month`, the bar's pill button.
2. **Hero, on the bar** (`hero.tsx`): a gold eyebrow `For California agents · $19 a month`; the
   `<h1>` `Three calls.` in Archivo 900, 72px on a phone and 128px from 640px; the lead
   sentence; the CTA and a `See the sample note` link; then `A sample call list`, three gold
   cards, each with its number, its call tag (the call list's own tag pair), the house and its
   sentence. The cards are a picture: they have no controls and respond to nothing.
3. **What it is**, on the page (`story.tsx`): two cards, what the people on the list get
   (on `--surface`) and what the agent gets (on the bar). Recorded facts and the MLS listing are
   named separately.
4. **How it works**, on cream: three steps on bar cards, gold numbers.
5. **Every name comes with a reason**, on the page: the three reasons, labelled with the call
   tags' own words.
6. **The note**, on cream (`the-note.tsx`): `The note Marilyn gets.`, `Read the full sample`
   (`buttonClass`), the recorded deed as a definition list, and the real email in the shared
   preview frame (`DigestPreviewFrame`), with its Desktop/Phone and Email/Plain text toggles.
7. **Included in the $19**, on the bar (`plan.tsx`): eight features, each one built.
8. **Add-ons**, on the page: the registry's add-ons with their prices. Static rows, no switches.
9. **What it isn't** and **the price**, on the bar: four struck words, the price in gold at
   120/200px, `a month. Up to 250 homeowners. Cancel any month.`, the CTA and `Sign in`.
10. **Footer**, on the bar.

### `/sample`

The header (wordmark links home), an Archivo `<h1>` `The note, as a homeowner gets it.`, the
shared preview panel (`DigestPreviewPanel`, unchanged: `A sample note for Marilyn`, both toggles,
the email or its plain text), the CTA, and the footer.

The email inside the iframe has its own design and is exempt from the 15px and token rules
because it is an email. Its MLS block carries its attribution line, so invariant 9 holds.

## Colour and type

- Grounds: `--bar` (navy, dark in both themes), `--background`, `--surface`, `--cream`.
- `--gold` is words only on the bar, a fill only under `--on-gold` words, and a mark (an
  underline, a rule, a strike) on the page and on cream. Every pair is in `tokens.test.ts`.
- Nothing on cream is muted: `--muted-ink` on `--cream` is 4.50:1 in light, under the floor.
- Archivo comes only through `displayClass` (`src/app/marketing/ui.ts`). Body text is Inter.
- Dark mode: every ground and accent has a dark value; `home-dark` measures it.

## Controls

| Label | What it does |
|---|---|
| `Start for $19 a month` (header, hero, price, `/sample`) | Link to `/register`: `barButtonClass` on the bar, `buttonClass` on the page, with `.tap`. |
| `Sample note`, `See the sample note`, `Read the full sample` | Links to `/sample`. |
| `Sign in` | Link to `/login`. |
| `onrecord` on `/sample` | Link to `/`. |
| `Desktop` / `Phone`, `Email` / `Plain text` | The shared preview frame's toggles (`preview-panel.tsx`). |

Every link takes a shared class and `.tap`, and nothing on the page listens for a mouse or a
hover: `src/app/marketing.test.ts` “every marketing link takes a shared class and .tap; nothing
listens for the mouse”.

## States

| State | What renders |
|---|---|
| `/` populated | Everything above. Captured: home, home-dark. |
| `/` loading, error | The root `loading.tsx` and `error.tsx`. `canonicalFacts()` and `sampleCalls()` throw if a fixture stops producing what the page shows. |
| `/sample` populated | Captured: sample; Plain text in dark: sample-text-dark. |
| `/sample` loading, error | `src/app/sample/loading.tsx`, `src/app/sample/error.tsx`. |
| Empty | None: both pages read fixtures, not the database. |

## What the page must not claim

Cut in OR-053 (OR-052 §2): texting homeowners, the engagement signal, the county list and county
check, "past clients" for MLS imports, a setup time, "Daily logins", and the v0 export's weekly
note and campaigns. Each is a test: `src/app/marketing.test.ts` “the marketing page does not
claim %s (OR-052)”. "From the county record" stays (Director, OR-052 §6), while the providers
serve fixtures.

## Tests that assert on this screen

- `src/app/marketing.test.ts`: one Oakdale story (with the deed); no figure typed in; the claims
  above; the sample call list is the real signal code; the add-ons are the app's; links and mouse.
- `src/app/design-scope.test.ts`: Archivo only in four files, imported only by marketing files;
  fonts bundled, with no Google Fonts link anywhere.
- `src/app/tokens.test.ts`: the gold and cream pairs, light and dark.
- `src/app/disabled-state.test.ts`: no opacity, in a class or a style.
- `src/app/design-debt.test.ts`: tokens only.
- `src/app/digest/preview-panel.test.ts`, `src/app/sweep.test.ts`: the preview frame.
- `e2e/screens.spec.ts` on home, home-dark, sample, sample-text-dark at 390 and 1440, and
  `e2e/desktop-unchanged.spec.ts` on demand.

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
