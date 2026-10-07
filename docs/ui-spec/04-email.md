# The monthly email (the "digest", or "note")

**Code:** `src/digest/**`. **Captures:** none. The browser pass does not measure the email; it lives in
an iframe that `e2e/checks.ts:12` exempts ("the rendered email lives in an iframe and is not measured").
The sample page (capture: sample, sample-text-dark) shows the full example inside the app's preview panel.

**Out of scope for an app redesign.** The email has its own design. App tokens (the CSS variables in
`src/app/globals.css`, such as `--foreground` or `--coral-text`) must never reach `src/digest`, and a test
fails the build if one does (`src/app/design-scope.test.ts:39`, see Tests). Restyling the app changes
nothing here, and nothing here should be restyled to match the app.

## What it is and who receives it

Once a month, each homeowner in an agent's list gets one email about their own house, written from
county recorded documents and the assessor roll, signed by the agent. The repo calls it the digest in
code and "the note" in copy. The agent never writes it; `renderDigest` (`src/digest/render.ts:16`) builds
it from data and either returns an email or a reason not to send.

Who gets one, from the monthly compose job (`src/jobs/compose.ts:30-46`): a live (not deleted) contact in
the account, with status `matched`, a matched house (`parcelId` not null), and a `monthly` subscription
that is not unsubscribed. Then, per person, in order:

| Check | Skip reason shown to the agent (quoted) | Where |
|---|---|---|
| No email address | `No email address on file. Add one to send.` | `compose.ts:53-56`, copy `src/digest/skip-copy.ts:2` |
| Address suppressed (unsubscribed, bounced, complained, across every account) | `They asked not to hear from us.` | `compose.ts:57-60`, copy `src/suppression/suppressions.ts:12` |
| House not found for the person | `This person is not matched to a house yet.` | `compose.ts:61-64`, `src/digest/build-input.ts:126`, copy `skip-copy.ts:1` |
| Nothing new this month (the quiet month, below) | `Nothing new on their street this month.` | `compose.ts:66-69`, copy `skip-copy.ts:6` |

PROJECT_STATE.md:11 adds that for houses from the MLS import, the note "goes to whoever lives there now:
usually the buyer, not the client."

## The quiet month: when the whole email is not sent

`src/digest/render.ts:17-28`. Five content blocks are tried (record, four doors, taxes, street sales,
loan). Each returns nothing when it has nothing to say. Then:

```ts
if (content.length === 0 || !digestHasNews(blocks)) {
  return { send: false, reason: NOTHING_NEW_REASON }
}
```

Only three blocks count as news (`src/digest/news.ts:3-7`): `street_sales`, `four_doors`, `taxes`. The
record and loan blocks are context and can never be the reason to send. Why: packet OR-009b
(`packets/OR-009b.md`, commit a34574a "Stop sending when the only news is a recording on their own
house.") found that a note whose only news was Marilyn's own refinance "reads as her agent watching her
mortgage", and "That is how a monthly refinance notice starts to feel like surveillance."

A skipped person never gets an empty email. In the app the preview panel shows the reason instead of a
frame (`src/app/digest/preview-panel.tsx:104-108`).

## Blocks, in order

Order from `render.ts:38-45` (HTML) and `:46-53` (plain text, same order, blank line between blocks).
Each content block's HTML is preceded by a marker comment `<!--block:NAME-->` (`render.ts:41`).

| # | Block | Always? | Omitted when |
|---|---|---|---|
| 1 | Header (`blocks/header.ts`) | yes | never |
| 2 | Greeting and headline (`blocks/greeting.ts`) | yes | never |
| 3 | Record (`blocks/record.ts`) | no | no grant deed on the house (`record.ts:16-18`) |
| 4 | Four doors down (`blocks/four-doors.ts`) | no | no nearby listing (`four-doors.ts:23`). See the finding below: in real sends this is always |
| 5 | Property taxes (`blocks/taxes.ts`) | no | no assessed value (`taxes.ts:32`); fewer than two street sales with a price in the last 12 months, of the same use type (`taxes.ts:18-27`); or assessed value at or above the street median (`taxes.ts:34`) |
| 6 | What sold on your street (`blocks/street-sales.ts`) | no | no street sale with a price (`street-sales.ts:10-14`). Shows at most three, newest first |
| 7 | Your loan (`blocks/loan.ts`) | no | no deed of trust on the house (`loan.ts:11-13`) |
| 8 | Reply button (`blocks/reply.ts`) | yes | never |
| 9 | Lender co-brand (`blocks/lender.ts`) | no | the lender add-on is off or unset (`render.ts:36`, `build-input.ts:176`) |
| 10 | Footer (`blocks/footer.ts`) | yes | never. Drops the agent line when the lender block carries it (`render.ts:35-37`) |

The email's subject is the headline (`render.ts:30,38,55`), chosen by the strongest block present, in
this order (`greeting.ts:13-19`): four doors, taxes, loan, street sales, record. The copy
(`greeting.ts:5-11`):

- four doors: `A house down the street is for sale.`
- taxes: `What the county taxes you on, and what sold on your street.`
- loan: `The loan the county has on record.`
- street sales: `What sold on your street.`
- record: `What the county has on your house.`
- none of these (`greeting.ts:23`): `A note about your house.`

Section labels appear in the HTML only, not the plain text: `Four doors down` (`four-doors.ts:37`),
`Property taxes` (`taxes.ts:43`), `What sold on your street` (`street-sales.ts:23`), `Your loan`
(`loan.ts:27`). The record block's label `Recorder stamp` is in both (`record.ts:26,39`).

## Worked example: the full Oakdale note

`fullDigest()` (`src/digest/canonical-facts.ts:38-40`) renders the `full` scenario
(`src/digest/fixtures/scenarios.ts:125-130`): Marilyn Okafor, 1142 Oakdale Ave, La Verne, as of
September 15, 2026 (`scenarios.ts:11`). `canonicalFacts()` (`canonical-facts.ts:14-36`) pulls the same
numbers out for the marketing home page (`src/app/page.tsx:5`), and `fullDigest()` feeds the sample page
(`src/app/sample/page.tsx:7`), so marketing, sample and email tell one story
(`src/app/marketing.test.ts:10`). The canonical facts: street median `about $1,040,000`, taxed on
`$817,800`, difference `about $2,600`, listing `1187 Oakdale Ave` at `$1,065,000`.

Subject: `A house down the street is for sale.` All five content blocks render. The plain text, exactly
as `fullDigest().text` returns it (captured by running the function; blank lines separate blocks):

```
From Dana at Coastline
Coastline Realty

A house down the street is for sale.
Hi Marilyn,

Recorder stamp
Instrument / Grant Deed
Document 2019-0248117
Recorded March 14, 2019
Consideration $712,000
Vesting Marilyn Okafor
1142 Oakdale Ave, La Verne, CA 91750
You've owned it seven years and six months.

A house at 1187 Oakdale Ave is active listed at $1,065,000.
Your house: 3 bed, 2.0 bath, 1,680 sq ft
That listing: 3 bed, 2.0 bath, 1,720 sq ft
Listing courtesy of Hillside Brokerage / Pat Rivera.

Homes on Oakdale have recently sold for about $1,040,000. A buyer paying that would be taxed on it.
The county taxes this house on $817,800.
That difference is about $2,600 a year.
California lets some homeowners carry this to their next home.

1162 Oakdale Ave  $1,040,000 — recorded July 22, 2026 · document 2026-0722140
2334 Bonita Ave  $985,000 — recorded June 9, 2026 · document 2026-0609412
1108 Oakdale Ave  $1,120,000 — recorded May 1, 2026 · document 2026-0510881

The original loan on record is $569,600 from Cardinal Home Loans, dated March 14, 2019.

Reply to Dana at Coastline

Dana Whitfield · Coastline Realty · DRE 01998432
Numbers come from county recorded documents and the assessor roll.
Update this address
Unsubscribe
```

Where each line comes from: header `header.ts:6-13` (sender name, else agent name; brokerage if set).
Greeting `greeting.ts:26-32` (always `Hi <first name>,`; no time of day). Record `record.ts:24-49`; the
"owned" line from `ownedForPhrase` (`src/digest/format.ts:100-113`), numbers spelled as words up to
twenty. Four doors `four-doors.ts:24-35`. Taxes `taxes.ts:37-41`. Street sales `street-sales.ts:15-21`.
Loan `loan.ts:21-24`; when a reconveyance is recorded after the loan it adds
`Paid off or refinanced — recorded <date>.` (`loan.ts:22-24`). Reply `reply.ts:8`. Footer
`footer.ts:6-14`.

When the email is actually sent, the compose job swaps the footer's two placeholder links
(`href="#update-address"`, `href="#unsubscribe"`, `footer.ts:19,21`) for the person's signed unsubscribe
URL and appends that URL to the plain text (`src/unsubscribe/links.ts:33-39`, called at `compose.ts:71`).
Both links go to the same URL.

Other scenarios in `scenarios.ts:124-238` show the skip rules: `no street sales`, `static only` and
`recent payoff` skip; `one street sale only` sends record, street sales and loan (one sale is not enough
for a tax median); `assessed above street median` drops taxes; `thin` (no events, no sales, no assessed
value) skips.

## Design: a document, deliberately unlike the app

The app is Inter on theme tokens, with nothing under 15px. The email is a paper document: a serif body,
a "recorder stamp" box, small uppercase sans labels, and a 12px footer. It is meant to read like a
county record a homeowner could keep, not like a product screen.

The whole palette and type are in `src/digest/style.ts` (20 lines):

| Thing | Value | Line |
|---|---|---|
| Body font | `Georgia, 'Times New Roman', serif` | `style.ts:1` |
| Label font | `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | `style.ts:2-3` |
| ink (all text) | `#1a1a1a` | `style.ts:5` |
| paper (background) | `#f7f3ea` | `style.ts:6` |
| stamp (record box border and label) | `#3d2a1f` | `style.ts:7` |
| rule (hairline in the lender block) | `#c9bfae` | `style.ts:8` |
| accent (outer border, header underline, reply button) | the agent's `accentColor`, default `#1f4d3a` | `render.ts:31` |

Sizes, read from the blocks: headline 26px serif (`greeting.ts:29`), `Hi Marilyn,` 18px (`:30`), sender
20px (`header.ts:10`), brokerage 15px (`header.ts:11`), body lines 17px (`style.ts:15`, each block), record
rows 16px (`record.ts:27`), reply button 15px sans on the accent colour (`reply.ts:10`), lender lines 13px
(`lender.ts:13`). 12px uppercase letter-spaced sans for the `From` label and section labels
(`header.ts:9`, `four-doors.ts:37`), and 12px for the footer (`footer.ts:16-18`) and the MLS attribution
(`src/digest/mls-attribution.tsx:13`). The 12px is the email's own scale; it is not covered by the app's
15px rule. `MlsAttribution` keeps both sizes on purpose: "The email keeps its 12px ink. An app screen
takes 15px" (`mls-attribution.tsx:23-26`).

Email-client constraints the markup follows (`src/digest/email.ts`):

- Layout is nested `role="presentation"` tables with inline styles, 600px wide, `max-width:600px;width:100%`
  so it narrows on a phone (`email.ts:18-20`). The only `<style>` is `:root { color-scheme: light dark; }`
  (`email.ts:13-15`); email clients strip or ignore most stylesheets.
- No SVG, no script, no remote images (`render.test.ts:31`). This is why the v0 export's parcel map can
  never go in the email (`docs/audits/OR-027-v0-audit.md:179`), and why the export's tilted stamp was not
  carried over: "`rotate()` is unreliable in email clients" (`OR-027-v0-audit.md:188`).
- `color-scheme` meta tags declare light and dark (`email.ts:10-11`), but the email defines no dark
  palette: every colour is a fixed hex on paper. Dark rendering is left to the client.
- Every fact in the HTML is repeated in the plain-text part (`render.test.ts:44`).

### The preview panel in the app

`src/app/digest/preview-panel.tsx` shows the email inside the app (sample page, person detail, settings
appearance, admin preview). The email view is a sandboxed iframe on a white canvas in both themes on
purpose: `className="... border border-rule bg-white ..."` (`preview-panel.tsx:70-78`). The email is a
light document; the panel shows it as it arrives, not themed. The plain-text view is the opposite: it
uses the app's `bg-background text-foreground` (`:81`) so it holds contrast in dark mode. It once drew
#ededed on white in dark mode, 1.17:1 on four screens, found when the token scan was widened to the
whole tree (`docs/audits/reskin-screen-log.md:93-94`; PROJECT_STATE.md:53). Controls: `Desktop` (600) /
`Phone` (380) and `Email` / `Plain text` toggles (`preview-panel.tsx:51-68`). The panel is app UI and
may be redesigned; the iframe's white canvas and the email inside it may not.

## Domain rules the email carries

- **Recorded figures carry a document number.** Record block: `Document 2019-0248117` beside
  Consideration (`record.ts:29`). Each street sale: `— recorded <date> · document <number>`
  (`street-sales.ts:20`).
- **MLS figures carry a status and are never combined with recorded ones.** The listing sits in its own
  block with its status (`four-doors.ts:26`). The test `1187 Oakdale is the listing, never a recorded
  sale` (`tax.test.ts:65`) keeps the listing out of the sale lines. This corrects the v0 export, which
  listed 1187 Oakdale both as a recorded sale and as an MLS listing at the same price
  (`OR-027-v0-audit.md:154`). **Date: see the finding below; the block shows no date.**
- **`<MlsAttribution>` on every MLS block.** Four doors down is the only MLS block; it always ends with
  `mlsAttributionHtml` (`four-doors.ts:39`), text `Listing courtesy of <office> / <agent>.` or, with
  neither, `Listing courtesy of the listing office.` (`mls-attribution.tsx:5-10`).
- **No payoff balance.** The loan block states the original amount, lender and date, and whether a
  release was recorded (`loan.ts:21-24`). Nothing else. Also enforced repo-wide by the
  `no-payoff-balance` rule in `scripts/check-invariants.mjs:8-10`.
- **No home value estimate.** The tax block quotes the median of recorded neighbour sales, labelled
  "about", and what a buyer would be taxed on (`taxes.ts:37`); it never says what this house is worth.
  The v0 export's "Roughly today's market" and `estimate` badge were rejected for this
  (`OR-027-v0-audit.md:145`). `scripts/check-invariants.mjs:14-17` (`no-avm`) bans the field names.
- **No tax-eligibility assertion to a consumer.** The fixed line is
  `California lets some homeowners carry this to their next home.` (`taxes.ts:40`), held by
  `tax.test.ts:186-189`, which also bans `you (are|may be|qualify)`. PROJECT_STATE.md:69 rejects
  "You're a Prop 19 candidate" in consumer email: "Age is the eligibility gate and the record doesn't
  know it."
- **Tax figures from `config/ca-tax.ts`.** The rate is `input.tax.defaultTaxRatePct` (`taxes.ts:35`),
  set from `CA_TAX` (`src/config/ca-tax.ts:5`, `0.0115`, effective `2026-07-01`) in
  `build-input.ts:175`. `tax.test.ts:85` bans the literal rates from digest source.
- **Plain language outside the record.** No `reconveyance`, `grant deed`, `assessed value`, `parcel`,
  `portability`, `tax cap` and others outside the stamp (`plain-language.test.ts:4-16,26`). The stamp
  keeps the recorder's words because it is a quotation of the record.
- **The lender block is a co-brand, not an ad.** "No rate, no product, no call to action"
  (`lender.ts:6-10`).

## Tests that hold it

| Test | File:line | Asserts |
|---|---|---|
| the email keeps its own design: nothing in src/digest reads an app token | `src/app/design-scope.test.ts:39` | no file under src/digest contains `var(--<token>)` for any token in globals.css, or names globals.css |
| Fraunces stays on the marketing page | `src/app/design-scope.test.ts:31` | Fraunces / `font-serif` only in four listed files; the email's serif is Georgia, not the app's display face |
| digest renderer does not import a clock, database, or network | `src/digest/purity.test.ts:24` | no `Date.now(`, `fetch(`, drizzle, `node:fs`, postgres or date-fns in the renderer (build-input.ts and fixtures exempt) |
| renderer source stays free of a database | `src/digest/build-input.test.ts:25` | render.ts names no drizzle, getRuntimeDb, buildDigestInput, fetch or Date.now |
| digest:preview script writes fixture html without touching the renderer clock | `src/digest/script.test.ts:4` | the `pnpm digest:preview` script renders fixtures with no clock or database |
| every scenario produces the expected send decision and block list | `src/digest/render.test.ts:18` | each scenario's send/skip and block order; skips carry `Nothing new on their street this month.` |
| html has no svg, script, or remote images | `src/digest/render.test.ts:31` | also `color-scheme` and `max-width:600px` present |
| the text part repeats every fact from the html | `src/digest/render.test.ts:44` | every $ figure and document number in the HTML is in the text; `Hi Marilyn,`; no time-of-day greeting |
| record and loan alone are not news | `src/digest/news.test.ts:12` | those scenarios skip |
| a document recorded on their own house is not news | `src/digest/news.test.ts:21` | `recent payoff` skips |
| a recent own-house recording still sends when the street has news | `src/digest/news.test.ts:29` | sends, and mentions `Paid off or refinanced — recorded ` |
| greeting is Hi and has no time of day | `src/digest/greeting.test.ts:4` | `Hi Marilyn,`, no Morning/Afternoon/Evening |
| four doors down includes MLS attribution | `src/digest/four-doors.test.ts:5` | `data-mls-attribution` and `Listing courtesy of Hillside Brokerage / Pat Rivera.` |
| four doors is omitted when the listing is missing | `src/digest/four-doors.test.ts:17` | no block and no attribution |
| tax block follows the street-median rule | `src/digest/tax.test.ts:11` | block present only when assessed is below median; figures; the carry line; no eligibility claim |
| the full Oakdale example produces about $2,600 | `src/digest/tax.test.ts:45` | median 1,040,000, assessed 817,800, `about $2,600` |
| 1187 Oakdale is the listing, never a recorded sale | `src/digest/tax.test.ts:65` | three sale lines, none naming the listing |
| no statutory number is copied into digest source | `src/digest/tax.test.ts:85` | no `0.0115`, `0.0125`, `1.15%`, `1.25%` in src/digest |
| loan copy never shows a remaining balance | `src/digest/loan.test.ts:5` | no "remaining balance", "payoff", "loan balance", "left to pay" in any scenario |
| plain language holds outside the record block | `src/digest/plain-language.test.ts:26` | the banned jargon list |
| lender block tests | `src/digest/lender.test.ts:19,28,41,62` | renders only with a lender; sits below reply and above footer; agent line exactly once; no rate, APR or loan call to action |
| marketing, sample, and the fixture share one Oakdale story | `src/app/marketing.test.ts:10` | canonical facts and `fullDigest()` agree |
| preview frame is sandboxed | `src/app/digest/preview-panel.test.ts:6` | `sandbox=""`, `srcDoc`, the four toggle labels, `aria-pressed` |
| skip shows a reason and no empty frame | `src/app/digest/preview-panel.test.ts:22` | panel branches on `result.send` and shows `result.reason` |

Also in `src/digest`: `format.test.ts` (dates, street label, rounding), `apply-look.test.ts` (settings
preview swaps sender and accent live), `preview-pages.test.ts`, `preview-sort.test.ts`,
`load-settings-preview.test.ts:6` (the settings sample is the full fixture), and
`build-input.integration.test.ts:121` (assembles one digest, ignores other accounts and unmatched people).

## Findings from the code (not intent)

- **Four doors down never appears in a real send.** `buildDigestInput` sets `nearbyListing: null`
  (`src/digest/build-input.ts:174`); nothing else in src sets it. The block, its headline and its MLS
  attribution appear only in fixtures, the sample page and the settings sample.
- **The listing shows a status but no date.** `four-doors.ts:26` renders status and price; `listDate`
  exists on the type (`src/digest/types.ts:48`) but is never rendered. This falls short of "MLS figures
  carry a status and a date" in CLAUDE.md.
- **The listing sentence reads `is active listed at`** (no comma), from `four-doors.ts:26` lowercasing the
  status into the sentence.
- **The tax block's median has no document number of its own.** `Homes on Oakdale have recently sold for
  about $1,040,000` (`taxes.ts:37`) is a median of recorded sales whose numbers appear in the street-sales
  block, which is present whenever taxes is (taxes needs at least two priced sales).
- **`Update this address` goes to the unsubscribe URL**, the same as `Unsubscribe` (`links.ts:36-37`).
