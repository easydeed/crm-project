# OR-009 — Digest renderer

```
TASK: OR-009
BRANCH: feat/digest-renderer

OBJECTIVE
A pure function that turns one homeowner's records into the monthly
email — or decides the month is too thin to send.

WHY
Slice S3. Everything upstream exists to feed this function; everything
downstream exists to deliver its output. Thin-case handling is the
renderer, not a later patch.

SCOPE
- src/digest/ — renderer and one module per block
- Fixture scenarios, including every thin case
- Out of scope: the parcel map (OR-010), preview surfaces (OR-011),
  MLS data (no feed yet — the four-doors-down block receives null),
  sending, and any database or network access

SIGNATURE

  renderDigest(input: DigestInput): DigestResult

  DigestInput = {
    asOf: Date
    agent: { name, brokerage, dre, phone, senderName, replyTo, accentColor }
    contact: { firstName, closeDate }
    parcel: Parcel
    events: ParcelEvent[]
    streetSales: ParcelEvent[]
    nearbyListing: Listing | null
    tax: typeof CA_TAX
  }

  DigestResult =
    | { send: true, subject, html, text, blocks: BlockName[] }
    | { send: false, reason: string }

BLOCKS, in order. Each content block renders only if its data exists.
  1. Sender header — always
  2. Headline + greeting — always
  3. The record — most recent grant deed; omit if none
  4. Four doors down — null in this packet's production input; build
     with a fixture listing; MLS attribution whenever rendered
  5. Property taxes — tax rule below
  6. What sold on your street — at least one recorded sale, up to three
  7. Your loan — latest deed of trust; reconveyance in plain language
  8. One reply button — always
  9. Footer — always

TAX RULE
  - assessed_value from the roll. Never compute from base year.
  - streetMedianSale = median of recorded street sales in the trailing
    12 months, same property type. Need ≥2 or omit.
  - Fact about the street, never a home value estimate.
    Names: streetMedianSale, never homeValue or estimatedValue.
  - Annual benefit = (streetMedianSale − assessed) × CA_TAX rate,
    nearest hundred, labeled "about".
  - Omit if assessed ≥ streetMedianSale.
  - Never assert Prop 19. Copy: "California lets some homeowners
    carry this to their next home."

SKIP RULE
  Content blocks: record, four doors, taxes, street sales, loan.
  Fewer than two → { send: false, reason }.

EMAIL
  Tables, inline styles, 600px. No SVG, JS, or remote images.
  Georgia/serif body; system sans labels. Text mirrors HTML facts.
  Dark-mode meta.

PLAIN LANGUAGE
  Outside the record block, rendered text must not contain:
  reconveyed, reconveyance, recorded transfer, grant deed,
  assessed value, base year, parcel, portability, deed prices,
  title officer, tax cap.

ACCEPTANCE
1. renderDigest is pure: no db, fetch, or Date imports; asOf only
2. Every scenario produces the expected send decision and block list
3. Tax block obeys every rule, each covered by a scenario
4. Loan block never shows a remaining balance
5. Plain-language test passes on every scenario
6. HTML contains no svg, script, or remote image tags
7. Text part contains every fact the HTML contains
8. Four doors down renders with attribution when given a listing
9. No statutory number appears outside CA_TAX
10. No file over 300 lines — one module per block
11. pnpm verify passes, CI green. Do NOT merge.

DO NOT
- Read a clock, a database, or the network
- Compute a home value or use value-estimate naming
- Assert tax eligibility
- Build the parcel map or preview surfaces
- Add a dependency
```
