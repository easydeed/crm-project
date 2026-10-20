# OR-052 — Audit of the marketing design (report only)

The design: `docs/claude-design/design_handoff_app_interior/Landing Page v6.dc.html` ("Landing"
below, with line numbers). It is the only marketing design in `docs/claude-design/`.
`SkinHandOff.zip` holds the same files. The handoff README lists it as "the marketing page this
interior is matched to (reference only)", and OR-040 audited only its claims, in three lines.
Line references are to the HTML file as committed. Ratios were computed from the literal colour
values, with the gold `oklch(0.80 0.12 82)` converted to sRGB `rgb(228, 182, 92)`. Sizes marked
"read" were read from the styles and not measured (`01-constraints.md` §9.2).

## 1. What the live page claims today

The deployed `/` (crm-project-gamma-seven.vercel.app, fetched 2026-10-20) is `HomeStory`: the
Oakdale sample in six lines and three links. It claims nothing the product lacks, apart from one
framing question: "from the county record" describes the sample, and the property and listing
providers are fixtures until real data is wired (`src/providers/current.ts` “Production keeps
the fixtures until real data is wired”).

The weekly email, "Text your clients or run campaigns" and "automated campaigns" are in
`reference/v0-export/components/marketing/pricing-lines.tsx` and `reach-addons.tsx`. Nothing in
`src/` imports `reference/`, and nothing deployed from this repo renders them. onrecord.com is a
parked domain owned by a third party.

## 2. Every feature, price or promise in the design

### Built

| Claim (Landing line) | Where it lives |
|---|---|
| $19 a month (:33, :46, :293) | `src/config/costs.ts` `PLAN.priceCents` 1900 |
| One email a month, in your name (:48, :77, :82) | the digest renderer and the scheduler; sending is gated by `SEND_ENABLED` |
| Three names to call, sometimes fewer (:77, :87-88) | `src/app/app/call-list-view.ts` `CALL_LIST_SIZE = 3`, quiet when fewer |
| Big sale next door, Paid off their loan, Taxes worth a talk (:141, :147, :163) | `src/app/app/call-tags.ts`, `src/signals/` |
| Upload a list, or an MLS ID and the homes you sold (:109) | import and `/app/start` |
| Matched to the county record; review the unsure ones (:118-119) | matching and the review queue, against fixture data |
| Sends on the day you pick (:129) | sending settings; `05-open.md` #31 can lose a month's send |
| Preview before it sends (:321) | the preview panel |
| Skip a month, resume (:322) | `skipMonthAction`, `resumeMonthAction` |
| Send day, time and timezone (:323) | `src/app/app/settings/sending-form.tsx` |
| Name, brokerage, DRE and phone (:324) | the email footer and Settings |
| Groups (:325), export (:326) | the People page; "Export this list" |
| Unsubscribes handled (:327) | `/u/[token]` |
| Undo a call (:328) | five seconds |
| Add my lender, free (:332) | the `lender` add-on, priced 0 |
| Text me the call list, +$2/mo (:331) | the `text_call_list` add-on, priced 200; texts are gated by `TEXTING_ENABLED` |
| Up to 250 homeowners, cancel any month (:294) | `PLAN.contactLimit` (displayed, not enforced in code); the cancel screen |

### Not built, or not true

| Claim (Landing line) | Finding |
|---|---|
| "Text my clients" +$9/mo, 250 texts, 2¢ after (:333) | No such add-on. Only `text_call_list` and `lender` are registered (`src/addons/registry.ts`). |
| "Reading it closely: Opened your last three. Clicked the tax part twice." (:169-175) | An engagement signal. The `opened` and `clicked` event kinds exist in the schema, nothing writes them, and no call tag reads them. Invariant 8. |
| Six counties, "We'll tell you at signup" (:297) | No county check exists at signup. |
| "emails your past clients" (:48) | The MLS import writes to whoever lives there now, not past clients (`01-constraints.md` §4). |
| "in about four minutes" (:97-98) | Never measured. |
| "Daily logins" crossed out (:363) | The call list needs a sign-in unless the texting add-on is live. |
| Hero card 01 (:311) | Tagged "Big sale next door" with the sentence "1187 Oakdale Ave just listed": an MLS listing under a recorded-sale tag. |
| Hero card 03 (:313) | Marilyn's $817,800 and $1,040,000 on a different person in Riverside. |
| APNs (:114, :190) | Two different invented APNs for 1142 Oakdale Ave. The fixture has none. |
| "Call Marilyn" (:67) | Drawn as a button; it is not a control. |

## 3. Canonical figures

Typed as literals in the design, all matching `canonicalFacts()`: 1142 Oakdale Ave, La Verne
91750, Marilyn Okafor, about $1,040,000, $817,800, about $2,600, 1187 Oakdale Ave.

Matching the `full` fixture but not exposed by `canonicalFacts()`: Grant Deed, document
2019-0248117, March 14, 2019, $712,000 (:192-195).

The email on Landing (:200-221) is a mock, not the renderer's output: its header is "On the
record · October / Dana Whitfield", and "You bought in 2019 for $712,000" carries no document
number. `/sample` renders the real email.

## 4. Against `docs/ui-spec/01-constraints.md`

| § | Verdict | Detail |
|---|---|---|
| 1.1 | Likely red | Survey-line text clipped by `overflow:hidden` (:38-44, :284-290); a 620px absolutely positioned card stack (:55). |
| 1.2 | Red (read) | Nav links and the header CTA: 12px padding on 15px text (:28-33). Add-on rows are clickable `div`s (:253). |
| 1.3 | Red | 13px (:46, :76, :104, :227, :243), 12px (:81, :124, :141, :187, :202), 11px (:61, :154, :259), 10px (:189, :192, :197), 14px (:305). |
| 2.1 | Red | New colours: gold, cream `#f7f3ea`, `#121c33`, `#262d3a`, `#c7cdd8`, `#3d4659`, `#3d2a1f`, `#c9bfae`, `#e3dccd`, `#b4432a`, `#dce3ee`, and four `rgba()` shadows. |
| 2.2 | On or under the floor | `#63708a` on cream 4.50; `#6b7487` on navy 3.81 (:277). |
| 2.5 | Red | Off add-on border `#dce3ee` on white 1.29; gold on cream 1.70; gold underline on white 1.88 (:97). |
| 2.6 | Holds | Every tag has words. |
| 2.7 | Red | A fixed navy and white page with no dark values; white and cream sections are hard-coded backgrounds. |
| 3.1 | Red, uncaught | `opacity:.85` in a style prop (:197). `src/app/disabled-state.test.ts` matches `opacity-NN` utilities only. |
| 3.3 | Red | The "Coming" row's switch takes a separate disabled track (:356). |
| 3.5 | Red | Every button is styled one-off. |
| 4 | Red | Section 2's list; the engagement label. |
| 5 | Red | Archivo 900 and IBM Plex Mono from Google Fonts (:11-12); the `<h1>` moves off Fraunces. |
| 6 | Red | No focus rings; the add-on rows are not reachable by keyboard. |
| 7 | Red | Hover-shuffled hero cards on mouse-enter only (:57), a hover lift (:50), smooth scroll (:19), switch transitions. |
| 9.1 | Red | "Call Marilyn" is not a control; `href="#"` links. |

## 5. Tests it would break as drawn

- `src/app/marketing.test.ts` “marketing, sample, and the fixture share one Oakdale story” and
  “Fraunces is the home <h1> and nothing else on the page (OR-038)”.
- `src/app/design-scope.test.ts` “Fraunces stays on the marketing page: only the listed files
  under src name it” (its allowlist fails both ways). “fonts are bundled: nothing imports
  next/font/google, so no build fetches from Google” only catches an import; a `<link>` to Google
  Fonts would pass.
- `src/app/design-debt.test.ts` “all of src/app is tokens only, apart from the debt listed here”.
- `src/app/tokens.test.ts` “%s on %s clears %s:1” for any new token pair; 1.29, 1.70 and 1.88
  cannot pass.
- `src/app/disabled-state.test.ts` “primary buttons use buttonClass, not a copy of its string”.
- The browser pass on `home`: `text-15`, likely `tap-44` and `no-clipping`, and the exact desktop
  comparison.

## 6. Decisions (Director, 2026-10-20)

1. Archivo is allowed on the marketing page only, bundled with `next/font/local`.
2. Gold and cream become tokens with dark values; the gold is darkened until every pair passes.
3. Cut: "Text my clients", "Reading it closely", the six counties and the county check, "past
   clients" for MLS imports, "four minutes", "Daily logins". Hero cards: no listing under a
   recorded-sale tag, no borrowed figures, no invented APNs.
4. Keep "from the county record".
5. Close the two check gaps: inline `style` opacity, and a `<link>` to Google Fonts.

Built as OR-053.
