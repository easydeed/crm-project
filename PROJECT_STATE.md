# PROJECT STATE — onrecord

**This file is authoritative.** Do not resurrect rejected concepts unless explicitly instructed. When this file and any other document conflict, this file wins. Update it only through an approved task.

Last updated: 2026-08-31

---

## Product

A subscription service that emails a real estate agent's past clients one message a month about their own house, built from California county recorded documents and assessment data, and hands the agent three names worth calling.

**Not** a CRM. **Not** lead generation. **Not** a newsletter platform.

## Market

- California only. Counties in scope for MVP: Los Angeles, Orange, Ventura, San Diego, Riverside, San Bernardino. Agents outside these counties get an honest "not in your county yet" at signup.
- Buyer: a working residential agent, median age 57, who already pays for a CRM they don't open.
- Base price $19/mo, up to 250 homeowners.

## Product principles

1. The product does one thing. Every added screen is a liability.
2. Setup steps approach zero. The prior product shipped a recipient system and a scheduler; 42 accounts used neither. Agents route around setup.
3. The county record is always true and always late. The MLS is live and aspirational. Every figure shown must be legible as one or the other, never blended.
4. Never state what a home is worth. Show a comparable house and let the reader do the math. We have no AVM and don't want one.
5. Never assert tax eligibility to a consumer. State the facts; let them self-identify. Candidate scoring is agent-facing only.
6. Never state a loan payoff balance. The record doesn't know it.
7. Digital only. Nothing physical is ever sent.

## Validated decisions

- Prop 13 / Prop 19 as the hero insight, not equity. No lender is monetizing it, which is why it's unbuilt.
- "Four doors down": compare a nearby MLS listing to the subject home on beds/baths/sqft from the assessor roll.
- Signup via MLS agent ID → pull closed listings → "here are the 47 homes you've sold, untick anyone."
- Three agent call signals: a past client's home just listed (highest priority), a neighbor listed or sold, a reconveyance recorded.
- Two sending domains and two consent scopes from day one.
- Parcel-first send pipeline: refresh by parcel and ZIP, not per person.
- Add-on pricing in two bands: $2–4 software-only, $9 for anything touching carriers.
- Consumer SMS is $9/mo including 250 segments, 2¢ overage. Not $2.
- Top bar navigation. No sidebar.
- Groups live inside People. One people table.

## Rejected ideas — do not rebuild

| Rejected | Reason |
|---|---|
| Title company sponsorship / PCT branding | Removed from the product entirely. RESPA exposure and the product no longer depends on it. |
| Physical postcards | Digital only. Print vendors, postage, and address hygiene for a $2 upcharge. |
| Dashboard stat cards (getting the note / opened recently / % of list) | Analytics theater. The `43/250 · 17%` card pressured the user about a cap they don't care about. |
| Separate Groups navigation item | Two destinations for the same objects is how the last product grew two address books. |
| Campaign builder in the base plan | Prior product: 43 schedules, zero targeting a contact or group. The setup step is where agents quit. |
| Months of inventory, absorption rate, DOM distributions, price-cut stats, market temperature gauges | Homeowners don't know what these mean. This is TrendyReports' job, different buyer. |
| Multi-state tax logic / TaxRegime abstraction | California only. An abstraction with one implementation is indirection. |
| AVM or home value estimate | The entire positioning is "verifiable record, not an estimate." |
| "You're a Prop 19 candidate" in consumer email | Age is the eligibility gate and the record doesn't know it. Agent-facing signal only. |
| $2 consumer SMS | Underwater before the first message. A2P registration, campaign fees, carrier surcharges, $250 non-use fee. |
| "Sold in June — not by you" phrasing | Accurate but reads as a monthly accusation. State the fact, let the agent conclude. |
| Pipeline stages, dialer, task lists, AI chat assistant, dark mode toggle | Out of scope permanently. |

## Open questions — blocking, not yet answered

1. **Property data unit cost.** Per-record lookup was rejected on cost. Bulk assessor and recorder data for all California counties is the source, focused on the lower six.
2. **MLS agent-ID lookup.** Does `GET /properties?agent={id}&status=Closed` return usable history? Prior integration was a debug scaffold that never parsed a response. If this fails, signup falls back to CSV and the onboarding advantage is gone.
3. **Comprehension.** Five agents, ten seconds on the marketing page, then "what does that do?" If the answer isn't "it tells me who to call," positioning is wrong.
4. **Employment/IP.** California Labor Code 2870 carve-out for inventions related to the employer's business. Resolve before incorporating or taking revenue.

## Current phase

Pre-implementation. v0 prototypes exist for marketing, dashboard, People, Add-ons, Settings, and a `/lab` exploration set. No production code written.

## Build order

1. Schema + provider interfaces against captured fixtures
2. Digest renderer as a pure function — test thin cases first
3. Address matching + review UI
4. Send pipeline (5 idempotent jobs)
5. **Wire real providers, measure cost per parcel, STOP and check economics**
6. Auth, Stripe, add-on framework
7. Signup MLS lookup — build the found-nothing path first

## Current task

_none assigned_

## Last approved commit

_none_
