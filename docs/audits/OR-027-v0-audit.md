# OR-027 — v0 export audit

Read-only audit of `reference/v0-export/` (133 files). No file under `src/` was changed and nothing imports from `reference/`. Export paths are relative to `reference/v0-export/`; real-app paths start with `src/`, `e2e/` or `scripts/`.

**Bottom line.** The export is a **visual reference, not a source**. None of its screens can be dropped into `src/`. Every screen runs on a client-side mock store, is built on eleven packages this app does not have, and breaks at least one test that asserts markup or copy. What is worth keeping is the palette, the type pairing, the radius scale and a handful of layout ideas. All of it has to be re-expressed at 15px or larger and 44px or larger, on the markup we already have.

---

## 1. What is actually there

### Tree (two levels)

```
.gitignore  components.json  next.config.mjs  package.json  pnpm-lock.yaml
pnpm-workspace.yaml  postcss.config.mjs  tsconfig.json
app/          globals.css layout.tsx page.tsx
  app/        layout.tsx page.tsx addons/ people/ people/[id]/ settings/
  lab/        layout.tsx page.tsx audiences/ automations/ campaigns/ campaigns/new/
              composer/ people/[id]/ plans/ templates/
  login/ match/ privacy/ register/ sample/ terms/ unsubscribe/ why/   (one page.tsx each)
components/   parcel-map.tsx record-block.tsx tag.tsx wordmark.tsx
  app/        (14) add-people-dialog addon-bill addon-business-form addon-extra-row
              addon-texting addons-manager app-nav contact-detail contact-meta dashboard
              page-header people-list settings-manager signal-meta
  auth/       auth-shell record-artifact
  digest/     sample-digest sample-email
  lab/        (14 + builder/9) audiences-view automations-view campaign-index campaign-meta
              client-detail client-timeline lab-nav lab-store mls-attribution phone-preview
              plans-view sms-composer templates-gallery view-state
              builder/ audience-drawer campaign-builder schedule-summary step-review
                       step-what step-when step-who types.ts use-audience.ts
  marketing/  (18) call-list closing-cta doesnt-do hero inbox-preview marketing-footer
              marketing-header price-compare pricing-lines proof-band reach-addons
              sample-email-modal scroll-fx section-heading set-and-forget setup-steps
              survey-plat why-open
  match/      lot-card match-flow
  ui/         (12) badge button checkbox dialog input label select skeleton sonner switch
              table textarea
lib/          candidates format lab-audience lab-data lab-history lab-lots lab-sms
              lab-templates mock-data store.tsx types utils
public/       9 v0 placeholder icons/images (none referenced)
```

### Stack

| | Export | Real app |
|---|---|---|
| Next.js | 16.3.3 (`package.json:12`) | 15.5.25 |
| React | ^19, lock 19.2.4 | 19.1.0 |
| Router | App Router (no `pages/`) | App Router |
| CSS | Tailwind v4 CSS-first. `@tailwindcss/postcss` (`postcss.config.mjs:4`), no tailwind.config, `globals.css:1-3` imports `tailwindcss`, `tw-animate-css` and `shadcn/tailwind.css`, and `@theme inline` sits at `:5-49`. No CSS modules. Inline `style={{}}` 79× in 20 files, mostly `sample-email.tsx`. | Tailwind v4, with 2 colour tokens plus a dark-mode `@media` (`src/app/globals.css:4-18`) |
| Components | shadcn `base-nova` style (`components.json:3`) on **Base UI** (`@base-ui/react`), not Radix; icons from lucide | Hand-written components, no library |
| Build | `next.config.mjs:3-5` sets `typescript.ignoreBuildErrors: true`; `images.unoptimized: true` | Typechecked in CI |
| State | `StoreProvider` (lib/store.tsx) at the root, seeded from mock arrays; no server components read data | Server components, `accountId` on every query |

Dependencies the export needs that the real app lacks (11): `@base-ui/react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `next-themes`, `sonner`, `tw-animate-css`, `shadcn` (a CSS import), `@vercel/analytics`, and dev `postcss`.

---

## 2. Design tokens: concrete values

### Colour (`app/globals.css`, `:root`, light only)

| Token | Value | Line | Where it shows |
|---|---|---|---|
| `--bg` | `#ffffff` | 54 | cards, `bg-white` 115× |
| `--surface` | `#f2f5fa` | 55 | page body (`body bg-surface`, :93), street band in ParcelMap, 48× |
| `--line` | `#dce3ee` | 56 | every border (`border-line` 167×), input border |
| `--ink` | `#0e1729` | 57 | body text (`text-ink` 217×), dark panels (`bg-ink` 16×) |
| `--muted-ink` | `#63708a` | 58 | `text-muted-foreground` 266× |
| `--blue` | `#2f5bff` | 59 | primary buttons (`bg-blue` 51×), links, focus ring (`ring-blue` 54×) |
| `--blue-soft` | `#e7edff` | 60 | active nav, tags, chips (29×) |
| `--coral` | `#ff4a2b` | 61 | destructive, "needs review", sold lots (`text-coral` 29×) |
| `--coral-soft` | `#ffefeb` | 62 | coral tag background (16×) |
| `--green` | `#0e9f6e` | 63 | "on the map", called (8×) |
| untokenised | `#e7f6ef` | — | green-soft background, 6× (`tag.tsx:6`, `signal-meta.tsx:27`, `unsubscribe/page.tsx:211`) |
| accent swatches | `#2F5BFF #0E7C66 #B4462F #1A1A1A #7A4CC4` | `settings-manager.tsx:19` | agent accent picker |

shadcn aliases (`:65-82`) map as follows: background→bg, foreground→ink, primary→blue, secondary/muted→surface, muted-foreground→muted-ink, accent→blue-soft, destructive→coral, border/input→line, ring→blue.

The email palette is separate (`sample-email.tsx:7-15`): PAPER `#FDFCFA`, HAIR `#E2E5E4`, INK `#20293B`, MUTE `#6E7683`, OX `#8A2B3E`, OX_SOFT `#B0707C`, GREEN `#2F5D50`, SAGE `#8AA398`, and SERIF `Georgia, "Iowan Old Style", "Palatino Linotype", serif`.

Defect: `text-muted` (6×, `settings-manager.tsx:92, 121, 156, 180, 211, 228`) resolves to `--surface #f2f5fa`, so those labels are near-white on white (1.09:1).

### Type

- **Families** (`app/layout.tsx:8-17`): Inter, variable, as `--font-sans`; Fraunces at weights 500/600 as `--font-serif`. `font-mono` is used 16× with no mono font loaded. `--default-font-feature-settings: 'tnum' 1` (:48), and `* { font-variant-numeric: tabular-nums }` (:90).
- **Sizes**, as arbitrary classes with counts: 9px 2, 9.5px 1, 10px 6, 11px 29, 11.5px 6, 12px 47, 12.5px 38, 13px 122, 13.5px 39, 14px 89, 14.5px 11, **15px 53**, 16px 23, 17px 7, 18px 7, 19px 1, 20px 4, 22px 9, 24px 4, 26px 11, 28px 4, 30px 6, 32px 2, 34px 7, 36px 1, 38/50/56px (hero), 42px 1, 46px 2, 52px 1, 58/68px 1, 72px 1. Named: `text-sm` 11, `text-xs` 4, `text-base` 3. About **440 class uses are under 15px**. For comparison, `src/app/app/*.tsx` uses only 15, 17, 19 and 22px.
- **Weights**: `font-[560]` 113, `[620]` 78, `[680]` 48, `[600]` 36, `[540]` 33, `[700]` 9, `[640]` 9, `[500]` 3, `[720]` 1, `[660]` 1, `[400]` 1. Fraunces only loads 500 and 600, so the serif `font-[560]` (8×) is synthesised.
- **Tracking**: h1–h4 get `-0.02em` (:96-101). Also `tracking-[-0.02em]` 17, `[0.08em]` 13, `[-0.01em]` 13, `[0.1em]` 11, `[0.14em]` 9, `[0.12em]` 7, `[0.16em]` 6, `[-0.03em]` 5, `[0.06em]` 2, `[0.18em]` 1, `[-0.04em]` 1. `uppercase` 50× (eyebrows).
- **Leading**: `leading-relaxed` 92, `-tight` 11, `-none` 11, `-snug` 7, `[1.1]` 4, `[1.04]` 3, `[1.08]` 1.

### Spacing

The stock Tailwind 0.25rem scale, with no custom tokens. 1,307 uses; the most common are px-5 81, gap-3 78, gap-2 72, gap-1.5 69, mt-2/mt-3 47, px-3 44, px-4 43, mt-4 42.

### Radii

`--radius: 0.5625rem` (9px, :84). Scale (:37-43): sm 5.4px, md 7.2px, lg 9px, xl 12.6px, 2xl 16.2px, 3xl 19.8px, 4xl 23.4px. Usage: `rounded-full` 73, `-lg` 56, `-2xl` 54, `-md` 32, `-xl` 30. Arbitrary values: `[7px]`, `[18px]`, `[9px]`, `[5px]`, `[4px]`, `[3px]`, `[2px]`, `[2rem]`, `[2.2rem]`, `[2.5rem]`.

### Shadows

Named: sm 4, md 2, lg 1, xl 1, 2xl 1. There are 14 arbitrary shadows, all in marketing or auth, all built on ink `rgba(14,23,41,a)` with large negative spread. Examples: `0_18px_44px_-40px_rgba(14,23,41,0.4)`, `0_40px_90px_-50px_…0.85`, `0_10px_24px_-8px_var(--blue)`. In-app cards use a border only, with no shadow.

### Other

- `.plat-grid` is a 34px grid of `color-mix(in oklab, var(--line) 60%, transparent)` (:106-120).
- `.plat-fade` is a radial mask (:121-132).
- Motion easing is `cubic-bezier(0.2,0.7,0.2,1)`, with durations from 0.45s to 4.5s (:158-293).
- A global `prefers-reduced-motion` override sits at :296-310.
- `globals.css` itself is 310 lines.

---

## 3. Screen mapping

| Export route | Export file | Bucket | Real route / notes |
|---|---|---|---|
| `/app` | components/app/dashboard.tsx | **Real screen** | `/app` (`src/app/app/page.tsx`). The export adds a "Your groups" list (67-93) and three MiniFact tiles (115-119). "Fix these" links to `/match`. |
| `/app/people` | people-list.tsx (517 lines) | **Real screen** | `/app/people`. The export adds a "Farm" scope with 140 generated rows and engagement tags (460-465). |
| `/app/people/[id]` | contact-detail.tsx | **Real screen** | `/app/people/[id]` (+ `/edit`). The export adds an engagement tag (69-70) and an inline MatchFlow. |
| `/app/addons` | addons-manager.tsx + addon-*.tsx | **Real screen** | `/app/addons` (registry-driven `AddonsPanel`) |
| `/app/settings` | settings-manager.tsx | **Real screen** | `/app/settings`. The export has no billing screens (`/app/settings/billing`, `/cancel`). |
| `/login` | app/login/page.tsx | **Real screen** | `/login`. Mock password "onrecord" (22-30, 83). |
| `/register` | app/register/page.tsx | **Real screen, wrong audience** | `/register` is the agent signup. The export's is a homeowner signup ("Start following your home", :77). |
| `/match` | app/match/page.tsx + components/match/* | **Real screen, weak** | Closest is `/app/people/review`. The export's copy is homeowner-facing ("Which home should we watch?", :58). |
| `/sample` | `<SampleEmail>` | **Real screen** | `/sample`, which renders `fullDigest()` in `DigestPreviewPanel` |
| `/unsubscribe` | app/unsubscribe/page.tsx | **Real screen** | `/u/[token]` (a server route that returns HTML) |
| `/` | 11 marketing sections | **Real screen** | `/`. The marketing page is out of scope for re-skin (standing constraint). |
| `/lab`, `/lab/campaigns`, `/lab/campaigns/new`, `/lab/composer` | campaign-index, builder/*, sms-composer | **Rejected /lab** | "Campaign builder in the base plan" |
| `/lab/templates` | templates-gallery | **Rejected /lab** | Template gallery |
| `/lab/audiences` | audiences-view | **Rejected /lab** | Audiences, including `{pct}%` of list (:27, :130) = the "% of list" stat |
| `/lab/automations` | automations-view | **Rejected /lab** | Automations, including stat cards (:28-30) |
| `/lab/people/[id]` | client-detail + client-timeline | **Rejected /lab** | The full client page: parcel map, read-history timeline, one-off send |
| `/lab/plans` | plans-view | **Rejected /lab** | $29 "plus reach" band and "Unlimited people" (:28, :33). Contradicts the $19 / 250 plan. |
| `/privacy`, `/terms` | static | **Neither** | Placeholder legal copy; no real counterpart |
| `/why` | static | **Neither** | Homeowner explainer. Claims "what your home is worth" (:41). |

Real screens with **no export equivalent**: `/app/start` (MLS step 2), `/app/people/import`, `/app/people/review`, `/app/people/[id]/edit`, `/app/settings/billing` (and `/cancel`), and all of `/admin/*`.

### Forbidden content found (it must not travel with any styling harvested)

- **Home value estimate:**
  - `components/auth/record-artifact.tsx:49` `['Est. market', '$792,000']`
  - `sample-digest.tsx:113-123` "A buyer would be taxed on $1,040,000" with an `estimate` badge and "Roughly today's market"
  - `sample-email.tsx:222-225`
  - `app/why/page.tsx:41`
- **Engagement metrics:**
  - `contact-meta.tsx:17-20` (`ENGAGEMENT_META`: "Opening", "Never opened", "Quiet"), rendered at `people-list.tsx:460-465` and `contact-detail.tsx:69`
  - `signal-meta.tsx:30-35` `reading_closely`
  - `hero.tsx:183` "Marilyn opened all 3"
  - `marketing/call-list.tsx:13`
- **Open rate:** `campaign-index.tsx:217` `{openRate}%`.
- **Recorded and MLS blended on one house:** `sample-email.tsx:43` lists 1187 Oakdale as a recorded sale (doc 2026-1188402, $1,065,000). `:146-149` lists the same house as an MLS listing at the same price. ParcelMap lot `c` at `:20` carries that price with no document number and no attribution.
- **False provenance claim:** `sample-email-modal.tsx:96` "Every figure traces to a recorded document."
- **"payoff" word:** `sample-digest.tsx:178`. The copy itself is compliant, but it trips `scripts/check-invariants.mjs` `no-payoff-balance`.
- **Market stats:** `reach-addons.tsx:20` "6 days on market", `:201-202` "closed above ask".

---

## 4. The two signature components

### ParcelMap: `components/parcel-map.tsx` (133 lines)

- **Props** (16-28): `{ lots: Lot[]; streetName?: string = 'Oakdale Ave'; animated?: boolean = false; className?: string; ariaLabel?: string }`. `Lot` (`lib/types.ts:57-65`) is `{ id; col; row: 0|1; kind: 'client'|'sold'|'plain'; price?: number }`.
- **Renders:** one `<svg role="img">` with a computed viewBox, containing:
  - a street band (`fill-surface`) and a dashed centre line (`strokeDasharray="10 8"`);
  - the street name as uppercase 11px `<text>`;
  - one 74×48 `rx=8` rect per lot: client `fill-blue` with "You" at 11px, sold `fill-coral-soft stroke-coral` with a `$NNNk` label at 12px (`priceShort` prints "$1065k" with no comma), plain `fill-white stroke-line`.
  - With `animated`, lots get staggered `animate-in fade-in zoom-in-90` (tw-animate-css) at 90ms steps, plus `motion-reduce:animate-none`.
- **Data:** purely presentational. No hooks, no `'use client'`, no fetching. Every caller passes a hardcoded array (`sample-email.tsx:17`, `sample-digest.tsx:32`, `record-artifact.tsx:4`, `hero.tsx:9`, `lib/lab-lots.ts` hash-seeded).
- **Liftable with a props change? No.** It would need all of the following:
  1. `cn` from `clsx` + `tailwind-merge` (dependencies we lack), and tw-animate classes.
  2. Six colour tokens the real `globals.css` does not define.
  3. 11/12px text raised to 15px or more, which changes the geometry (LOT_W 74, LABEL_H 22).
  4. Coral price text at 3.35:1, which fails contrast.
  5. A bare `$NNNk` price. A recorded price needs a document number, and an MLS price needs status, date and `<MlsAttribution>` (invariant 9 and the domain rule).
  6. A data source. `parcels` has `lat`, `lng` and `streetNameNorm`, but no `col`, `row` or side.
  7. It can never go in the email: `src/digest/render.test.ts:31` bans `<svg`, and `src/digest/plain-language.test.ts` bans "parcel" outside the record block.

  It could only ever be an in-app illustration, rebuilt against real data.

### Recorder stamp: inline in `components/digest/sample-email.tsx:110-129`

- There is no component and there are no props. Data is `STAMP` at `:28-33`: Grant deed / Recorded Mar 14, 2019; Document 2019-0248117; Recorded price $712,000; Vesting Joint tenants.
- It is a `div` with inline `border: 2px solid #8A2B3E`, `maxWidth 340` and `transform: rotate(-1.1deg)`. The address "1142 Oakdale Ave" is hardcoded at 15px serif bold, "La Verne, CA 91750" at 12px OX_SOFT (3.75:1, fails), and the rows are 12px.
- Presentational and static, with no data access.
- **Liftable? No, and not needed.** The real app already has the stamp as `renderRecord` in `src/digest/blocks/record.ts:11-51`: table HTML labelled "Recorder stamp" with Instrument, Document, Recorded, Consideration and Vesting, styled from `src/digest/style.ts:5-8`. The export's version is styling reference only: the oxblood `#8A2B3E` rule and the slight tilt. `rotate()` is unreliable in email clients, so the tilt should not be carried over.
- Related decorative stamps, all hardcoded: `inbox-preview.tsx:56-62` (coral/70, 2.45:1), `record-artifact.tsx` (contains "Est. market"), and `record-block.tsx` (the in-app `<dl>` at 11–14px).

---

## 5. What would break the browser checks (`e2e/checks.ts`)

The rules: `tap-44` (`checks.ts:49`, smaller dimension of 44px or more, with inline links in text exempt at :34), `text-15` (:60, the email iframe is exempt), and no horizontal scroll or clipping at 390px.

### Interactive elements under 44px (about 138 source locations)

The export's primitives are all too small:

| Primitive | Size |
|---|---|
| `ui/button.tsx:22-33` | default h-8 = **32px**, xs 24, sm 28, lg 36, icon 32, icon-sm 28 |
| `ui/input.tsx:12` | h-8 = **32px** |
| `ui/select.tsx:44` trigger | 32px (sm 28). Items (`:120`) about 28px. |
| `ui/checkbox.tsx:13` | **16×16** |
| `ui/switch.tsx:19` | **32×18.4** |
| `ui/dialog.tsx:66-69` close | 28×28 |

- **Buttons:** 36 of 46 `<Button>` uses fail.
  - 32px: `people-list:193, 381`, `add-people-dialog:188, 195, 229, 236`, `templates-gallery:148, 156`
  - 36px: `dashboard:40, 182, 210`, `contact-detail:201, 227`, `addons-manager:148, 181`, `people-list:218`, and 10 more
  - 40px: `unsubscribe:112, 120`, `settings-manager:169`, `sample/page:44`, and 6 more
  - Only the h-12 overrides pass: login, register, match, and the marketing CTAs.
- **Form fields:** 23 fail. Examples: `people-list:236` Input 32px, `settings-manager:229` Field 36px (rendered 9 times), `unsubscribe:102` 40px, SelectTriggers `people-list:341, 369` and `settings-manager:130`, Switch at `settings-manager:160` and `addons-manager:109, 115`, Checkbox at `people-list:409, 440`.
- **Icon buttons:** 13 fail. Examples: `people-list:248, 255, 271, 281, 393` (32px), and `contact-detail:75, 83` mail/phone (36px).
- **Chips and segmented controls:** 24 fail, at 24–38px (e.g. `contact-detail:161`, `unsubscribe:182`, `people-list:495`).
- **Text buttons:** about 20px (`match/page:43`, `unsubscribe:78`, `match-flow:85`).
- **Links:** `app-nav:29` nav links are 36px. `wordmark.tsx:12` is about 25px and appears in every header. The dashboard links at `:72, 98, 155, 196` fail too.

### Text under 15px carrying information

There are 424 sub-15px size classes in 72 files, plus 18 inline sizes in `sample-email.tsx` and inherited `text-sm` (14px) from Button, Label, SelectTrigger and Dialog. Nearly all of it carries information:

- **Status tags:** `tag.tsx:26` is `text-xs` (12px) and used across people, dashboard and contact detail.
- **Figures:** APN/deed at `lot-card:33` (12px), the record block at 11–14px, the digest sales table at `sample-digest:137` (13px).
- **Labels:** `settings-manager:92, 121, 228` and `addon-business-form:58, 94, 147` (12.5px), and `people-list:415` "N shown" (12px).
- **MLS attribution:** `lab/mls-attribution.tsx:11` at 12px, with its mark at `:17` at **9px**. The required attribution would itself fail.
- **SVG text** is measured too: ParcelMap at 11–12px (and smaller once the SVG scales down), and SurveyPlat at 11–12.5px.
- `SampleEmail` renders inline, not in an iframe, so the email exemption does not apply to `/sample`.

### Horizontal scroll and clipping at 390px

1. `lab-nav.tsx:47-69`: five links (about 480px) in an `overflow-x-auto` nav of about 215px. Every `/lab/*` page fails. (Lab is rejected anyway.)
2. `sample-digest.tsx:136-137`: a 4-column 13px `<table>` in `overflow-hidden`. Unbreakable document numbers and prices clip about 40px inside the settings preview (`settings-manager:183`).
3. `truncate` on names and addresses: `people-list:265, 451, 454` (and 8 lab/hero lines). Each ellipsis is reported as clipping.
4. Decorative overflow inside `overflow-hidden` containers: `set-and-forget:91`, `hero:110`, `marketing-footer:43`, and SurveyPlat slices at `hero:28`, `closing-cta:10`, `proof-band:60`.
5. `templates-gallery.tsx:165` `max-w-lg` overrides the dialog's gutter, so it runs edge to edge.

### Also failing invariant 10 (not in checks.ts, but CLAUDE.md)

- **Focus rings:** the primitive halo `ring-ring/50` is **2.16:1**. About 40 interactive lines have no focus style. The closed mobile menu at `marketing-header:85-107` is still tabbable.
- **Contrast:** the `text-muted` labels (1.09:1), coral on white 3.35:1 (25 lines), coral tag 3.00, green tag 3.04, green on white 3.39, blue on blue-soft 4.42 (the active nav at `app-nav:36`), white/70 on blue 3.33, and component borders `#dce3ee` 1.29:1.
- **Motion:** mostly compliant thanks to the global override at `globals.css:296-310`. Inline `transitionDelay` is not zeroed (`scroll-fx.tsx:62`), and `matchMedia` is read once with no listener.

---

## 6. What would break the existing tests

I found every test that reads source or rendered markup and asserts structure or copy: **17 files, 75 tests**. The verdict below says whether the export's version of the screen, if it replaced ours, would still pass.

- **BREAKS:** the export's markup fails the assertion.
- **HOLDS:** the export would pass.
- **NO EQUIVALENT:** the export has no such screen, so a re-skin must keep ours.

### The six the Director named

| # | Test | File:line | Export verdict | Why |
|---|---|---|---|---|
| 1 | Delete confirmation says a re-import brings them back, and never "cannot be undone" | `src/app/app/people/people-ui.test.ts:120` | **BREAKS** | The export has no confirmation at all. `people-list.tsx:386-391` (bulk) and `contact-detail.tsx:232-237` delete on click and show a toast. |
| 2 | Found-nothing is `role="status"`, never `role="alert"`, followed by `<section id="upload"><ImportForm` | `src/signup/signup.test.ts:54` | **NO EQUIVALENT** | The export has no MLS step. `/register` is a homeowner flow. `/app/start` must keep its markup. |
| 3 | Add-on row off vs on differs only in the switch, with no opacity or muted colour, and `>Off<` text | `src/app/app/addons/addons-ui.test.ts:21` | **BREAKS** | `addon-extra-row.tsx:25` swaps the icon badge: `addon.enabled ? 'bg-blue text-white' : 'bg-blue-soft text-blue'`. No "Off" label either; the switch alone carries state. |
| 4 | `/app` renders exactly `<HomeSendCard`, `<CallListSection`, `<HomeownersSection>`, in order, nothing else | `src/app/app/call-list.test.ts:78` | **BREAKS** | `dashboard.tsx` renders a review alert, the call list, a "Your groups" list (67-93) and a "Next send" block of three MiniFact tiles (115-119), all in one client component. |
| 5 | Plain-language ban list outside the record block | `src/digest/plain-language.test.ts:26` | **BREAKS if its copy were used** | The test runs `renderDigest`, so it is only reached if export copy entered the renderer. Outside its stamp the export's email uses "parcels" (`sample-email.tsx:139`), "recorded transfers" (`:139`), "assessed value" (`:230`) and "Reconveyance" (`:50`, in the loan block). `sample-digest.tsx` has "parcel" (`:3`), "reconveyed" (`:21`), "grant deed" (`:94`), "assessed value" (`:104`) and "reconveyance" (`:175`). |
| 6 | MLS framing: "the homes you've sold", "goes to whoever lives there now", listing-side note, no "client" in the found line, no "past clients" in `call-list.tsx` | `src/signup/signup.test.ts:88` | **NO EQUIVALENT** | The export has no MLS import screen. It does promise past clients: `marketing/call-list.tsx` and hero copy talk about "clients" (marketing only). |

### Others I found

**`/app`: `src/app/app/call-list.test.ts`**

| Test | Line | Verdict | Why |
|---|---|---|---|
| No stat cards, counters, progress bars, `%`, `/250` | 88 | **BREAKS** in spirit | The MiniFact tiles (`dashboard.tsx:115-119`) are stat-card-shaped. They contain no `%`, so the literal regex may pass, but the rejected-ideas table forbids them. |
| Call list shows every state: 'Quiet month. That happens.', `href="/app/people/import"`, `href="/app/people/review"` | 94 | **BREAKS** | No quiet-month copy. "Fix these" links to `/match` (`dashboard.tsx:42`). |
| Call opens an inline panel, never a modal | 102 | HOLDS | Inline expand at `dashboard.tsx:194`, no Dialog |
| Both actions persist via server actions and undo for five seconds | 115 | **BREAKS** | `markCalled` is store-only, with no undo and no "Not now" |
| Not now hides a name; called stays visible | 131 | **BREAKS** | No "Not now". The called row is dimmed with `opacity-50` (`:146`). |
| Tag text and colour match the signal kind | 65 | **BREAKS** | It introduces a `reading_closely` kind (`signal-meta.tsx:30-35`), which is not in the schema |
| Panel reuses the note's record and loan blocks | 125 | **BREAKS** | The export panel is its own markup (`dashboard.tsx:194-218`) |
| Paused account still gets the call list; person page shows called dates | 142, 148 | NO EQUIVALENT | No paused state, no call history |
| Score order, quiet line, drop unknown kinds, same local month | 29–72 | NO EQUIVALENT | Logic tests; the export has none |

**Top bar: `src/app/app/top-bar.test.ts:4`**

| Test | Verdict | Why |
|---|---|---|
| Three links, `flex-nowrap`, no hamburger | **BREAKS** | `app-nav.tsx` has the three hrefs and no hamburger, but `:25` is `flex items-center gap-1 sm:gap-2` with no `flex-nowrap`. Its nav links are also 36px (`:29`). |

**People: `src/app/app/people/people-ui.test.ts`**

| Test | Line | Verdict | Why |
|---|---|---|---|
| List columns are name, address and status only; no email, phone, engagement or candidates | 8 | **BREAKS** | `people-list.tsx:460-465` renders `ENGAGEMENT_META`, and search reads `c.email` (`:75`) |
| Board has count, add people, search, export of the filtered view | 29 | **BREAKS** | No export/CSV control |
| Filters write status and group into the URL | 44 | **BREAKS** | `?group=` is read once as the initial value (`people-list.tsx:47`); group and status then live in `useState` (:51-52) and are never written back |
| Bulk bar only when a selection exists | 52 | HOLDS | Conditional render |
| Groups stay on this page and are optional | 63 | HOLDS on People, **BREAKS** overall | The dashboard adds a second groups surface (`dashboard.tsx:67-93`) |
| Detail fields, review href, add to group | 71 | **BREAKS** | No review href (inline MatchFlow instead); engagement tag at `contact-detail.tsx:69` |
| Edit form pre-fills every field (`defaultValue={person.email ?? ''}`) | 93 | NO EQUIVALENT | No edit screen |
| Four states for list and person | 104 | **BREAKS** | No `loading.tsx` or `error.tsx` anywhere under `app/app`. "Homeowner not found" is the only non-happy state. |
| Person review opens the queue at that contact | 113 | **BREAKS** | Routes to `/match` or the inline flow |
| Homeowner address change named on the contact | 24 | **BREAKS** | "May have moved" is a manual flag, not the recorded change |

**Review queue: `src/app/app/people/review/review-ui.test.ts`** (the export's `/match` + `components/match/*`)

| Test | Line | Verdict | Why |
|---|---|---|---|
| Review UI stays 15px or 22px with focus rings | 68 | **BREAKS** | 7 sub-15px classes in `match/page.tsx` and `components/match/*`; `lot-card:17` and `match-flow:85` have no focus style |
| Five-second undo | 54 | **BREAKS** | No undo; the "confirm" routes away after a 700ms timeout |
| Needs-review cards show typed name, address and "This one" | 17 | **BREAKS** | `lot-card.tsx` shows fabricated APN and owner, not "This one" |
| Four states | 61 | **BREAKS** | A fake 1300ms "searching" delay (`match-flow.tsx:30-33`) and no error state |
| Queue header, no_parcel options, done states | 8, 37, 45 | NO EQUIVALENT | |

**Add-ons: `src/app/app/addons/addons-ui.test.ts`**

| Test | Line | Verdict | Why |
|---|---|---|---|
| Empty state when nothing is registered | 34 | **BREAKS** | Seeded from `SEED_ADDONS`; no empty state |
| Two bands with headings, carrier note under texting, bill of only what is on | 42 | Partly holds | Has a texting section and `addon-bill.tsx`, but the band structure differs |
| Every switch goes through `assertWritable` | 55 | **BREAKS** | Switches write straight to the store |
| Four states | 64 | **BREAKS** | None |

**Settings and billing**

| Test | File:line | Verdict | Why |
|---|---|---|---|
| Live preview beside "How the email looks": `loadSettingsPreview`, `AppearanceForm`, `lg:grid-cols-2`, `applyPreviewLook`, `SAMPLE_LABEL` | `settings-ui.test.ts:8` | **BREAKS** | The preview is a hardcoded inline `SampleDigest` (`settings-manager.tsx:183`), not the real render. Its labels are the invisible `text-muted`. |
| Four states | `settings-ui.test.ts:27` | **BREAKS** | None |
| Invoice history, cancel screen, no Stripe portal, four states | `billing-ui.test.ts:10, 29, 40` | NO EQUIVALENT | The export shows `BILLING` as a constant ("Visa 4417") |

**Digest preview and sample**

| Test | File:line | Verdict | Why |
|---|---|---|---|
| Preview frame is sandboxed and email CSS does not leak | `src/app/digest/preview-panel.test.ts:6` | **BREAKS** | No iframe anywhere in the export; the sample renders inline |
| Skip shows a reason, no empty frame | `preview-panel.test.ts:22` | NO EQUIVALENT | |
| Marketing, `/sample` and the fixture share one Oakdale story via `canonicalFacts`/`fullDigest` | `src/app/marketing.test.ts:9` | **BREAKS** | The same facts (1142 Oakdale, Marilyn, $817,800, $1,040,000) are retyped as literals in `sample-email.tsx:104-225`. `app/sample/page.tsx` does not call `fullDigest`. |
| HTML has no `<svg>`, script or remote images | `src/digest/render.test.ts:31` | **BREAKS if its email were used** | `sample-email.tsx:137` embeds `<ParcelMap>`, an SVG |
| Text part repeats every fact from the HTML | `render.test.ts:44` | NO EQUIVALENT | The export has no text part |

**Unsubscribe: `src/unsubscribe/unsubscribe.test.ts`** (export `/unsubscribe` vs real `/u/[token]`)

| Test | Line | Verdict | Why |
|---|---|---|---|
| Page shows the house and only the scopes still on | 62 | **BREAKS** | Two hardcoded scopes, `useState({ monthly: true, weekly: true })` (:17). "Weekly market update" is a scope that doesn't exist. |
| A bounced address cannot sign back up | 92 | **BREAKS** | No bounce state |
| "Keep them coming" only when every stop is the homeowner's own | 106 | **BREAKS** | Not modelled |
| Bounce or complaint anywhere makes it irreversible | 117 | **BREAKS** | Not modelled |
| Token stable and scoped; both unsubscribe headers | 15, 34 | NO EQUIVALENT | Server logic |

**Import: `src/import/skip-reasons.test.ts`**

| Test | Line | Verdict | Why |
|---|---|---|---|
| Skip reasons are the exact product strings | 5 | **BREAKS** | `add-people-dialog.tsx` has no skip reasons; every pasted row is added |
| Result screen has the required links and counts | 12 | **BREAKS** | A toast replaces the result screen |

**Admin and copy**

| Test | File:line | Verdict |
|---|---|---|
| System pause tells the agent what happened, without blame ("We paused your monthly note.", 'Contact us') | `src/app/admin/sends-ui.test.ts:35` | NO EQUIVALENT. The export's only pause is the agent's own switch (`settings-manager.tsx:154`). |
| Admin jobs, matching and preview UI tests | `src/app/admin/{jobs,matching,preview}/*-ui.test.ts` | NO EQUIVALENT. The export has no admin screens, so leave `/admin` out of the re-skin. |
| Person page previews the email without a write guard | `src/app/app/people/people-preview.test.ts:8` | NO EQUIVALENT |
| Support address and pause mailto | `src/config/support.test.ts` | NO EQUIVALENT. The export's `marketing-footer` links are `href="#"`. |
| Signal detail sentences are plain language; tax stays conditional; payoff sentence names no balance | `src/signals/plain-language.test.ts:19, 31, 43` | **BREAKS if its copy were used.** `signal-meta.tsx` adds `reading_closely` (an engagement signal). `sample-email.tsx:235-236` "Proposition 19 may let you take it with you" is close to consumer eligibility copy. |

### Also caught by the source scanners, not the unit tests

- `scripts/check-invariants.mjs`: `no-payoff-balance` fires on "payoff" at `sample-digest.tsx:178`.
- `scripts/check-file-length.mjs`: `people-list.tsx` (517 lines) and `sample-email.tsx` (350 lines) exceed 300 lines.
- `src/db/contacts-access.test.ts` / `people-scope.test.ts`: the export never passes `accountId`. Any data access copied from it would fail the scoping rules.

### Plainly

If the export's screens replaced ours, these would go red:

- **Core app screens** (the tests I can see failing directly on the export's markup):
  - `/app` composition, quiet month, undo, and "Not now"
  - the `flex-nowrap` top bar
  - people columns and engagement, URL filters, four states and delete copy
  - the add-on off row
  - the review queue: 15px, undo and "This one"
  - the settings preview and four states
  - the sandboxed preview
  - the shared Oakdale story
  - all four unsubscribe scope and bounce tests
  - both skip-reason tests
- **Copy and render tests** that break only if export copy or email markup entered the renderer: plain language, no SVG, signal plain-language.
- **Screens where ours has no export counterpart**, so the re-skin must keep our markup and only restyle it: `/app/start` (found-nothing status, malformed id, MLS attribution, MLS framing), import, edit, billing, admin.

The export satisfies only three of the markup tests: the inline call panel, the conditional bulk bar, and groups living on People.

---

## 7. What this app cannot use

| Pattern | File(s) |
|---|---|
| localStorage / sessionStorage / IndexedDB | **None.** All state is in-memory and lost on reload. |
| Root mock store: `StoreProvider` seeds contacts, groups, add-ons, farm, profile, look and sending from mock arrays | `lib/store.tsx:112-145`, mounted at `app/layout.tsx:53`. `BILLING` constant at `:20-25`. |
| Lab mock store: `LabStoreProvider` | `components/lab/lab-store.tsx:85-90`, with `Date.now()` ids (:94, :102) |
| Client components reading the store | dashboard:16, people-list:45, contact-detail:20, settings-manager:29, addons-manager:49, addon-bill:7, addon-extra-row:55, addon-texting:19, add-people-dialog:25, plus every lab component |
| Mock data files | `lib/mock-data.ts` (427 lines: `SEED_CONTACTS`, `CALL_SIGNALS`, `SEED_GROUPS`, `SEED_ADDONS`, `FARM_CONTACTS` = `generateFarm(140)`), `lib/lab-data.ts`, `lab-templates.ts`, `lab-history.ts` (fake opens and clicks), `lab-lots.ts`, `lab-audience.ts` (fixed `NOW` 2026-08-31), `lab-sms.ts`, `candidates.ts` (fabricated APNs and owners), `format.ts` (fixed now at :24) |
| Fabricated record on confirm | `contact-detail.tsx:120-135` (`recordedPrice: 720000`, `assessedValue: 792000`, `streetMedian: 915000`) |
| Hardcoded arrays inside components | `sample-email.tsx:17-51`, `sample-digest.tsx:13-41`, `record-artifact.tsx:4, 44-50`, `hero.tsx:9, 22`, `marketing/call-list.tsx:7`, `inbox-preview.tsx:5`, `why-open.tsx:6`, `proof-band.tsx:6`, `reach-addons.tsx:13`, `set-and-forget.tsx:30-43` |
| Mock auth | `app/login/page.tsx:22-30` (password "onrecord", shown at :83). `register/page.tsx:184-187` and `match/page.tsx:107-110` use `setTimeout` redirects. No session check on `/app/*` or `/lab/*`. |
| Simulated behaviour (dead controls under invariant 1) | `match-flow.tsx:30-33` fake delay; `campaign-builder.tsx:63`; `addon-texting.tsx:166-169` and `view-state.tsx:20, 34` "Prototype state" switchers; `sms-composer.tsx:176-182` "Use this text" does nothing; `client-detail.tsx:197-201` |
| Dead links | `href="#"` at `sample-email.tsx:316, 338, 342`; farm rows link to `/app/people/{id}` and land on "not found" (`people-list.tsx:446` vs `contact-detail.tsx:21`) |
| Browser APIs (client only) | `auth-shell.tsx:45`, `marketing-header.tsx:20-23`, `scroll-fx.tsx:16, 42, 87, 93-140`, `price-compare.tsx:24, 28`, `sms-composer.tsx:38`, `step-what.tsx:26` |
| Missing dependencies | `@base-ui/react` (ui/* and sample-email-modal); `class-variance-authority` (badge, button); `clsx` + `tailwind-merge` (`lib/utils.ts` `cn`, used by nearly everything, including ParcelMap); `lucide-react` (43 files); `sonner` (14 files); `next-themes` (`ui/sonner.tsx`); `tw-animate-css` and `shadcn` (CSS imports, `globals.css:2-3`); `@vercel/analytics` (`layout.tsx:55`) |
| Network | No `fetch` and no URLs. `next/font/google` for Inter and Fraunces; the real app already uses `next/font`. |
| Config | `next.config.mjs:3-5` `ignoreBuildErrors: true`, never to be copied |
| Colour scheme | Export is light-only (`layout.tsx:27-28`, `globals.css:52`). The real `globals.css:17-18` follows the OS dark preference. Copying the export's globals would drop that. (A dark-mode *toggle* is rejected; this is only the OS preference.) |

---

## 8. Recommendation

### Harvest as-is (values only, typed by hand into `src/`, never imported)

- **The palette** (§2): the ten `:root` colours, plus `#e7f6ef` promoted to a `--green-soft` token.
  - Colours that fail as text need adjusting before they can carry words: coral `#ff4a2b` (3.35:1) and green `#0e9f6e` (3.39:1) on white, and the coral, green and blue-on-soft tag pairs.
  - For those, a darker text variant is needed (a design-system decision for the v0 prompt), or they stay as fills and borders only.
- **The type pairing**: Inter for UI and Fraunces 500/600 for headings, through `next/font/google`. That is a font, not an npm dependency, so no new package is needed. Tabular numerals everywhere.
- **The radius scale** from 9px, the h1–h4 `-0.02em` tracking, and the border-not-shadow card treatment for in-app screens.

### Reference only (look at it, rebuild it on our markup)

- The dashboard call-list row layout (tag, name, sentence, inline expand), the People row density, and the add-on row with its bill summary. Rebuild each at 15px or larger and 44px or larger, inside our existing components, so the tests above keep passing.
- The recorder stamp's oxblood rule, as a styling note for `src/digest/blocks/record.ts`. It needs an email-safe rewrite with no rotation, and that belongs to a digest packet, not an app re-skin.
- ParcelMap as a concept for a future in-app illustration. It needs a data source, 15px labels, document numbers or MLS attribution on every price, and it never goes in the email.

### Ignore entirely

- All of `/lab`, which is rejected.
- `components/ui/*`: it depends on Base UI, its sizes are 32px, and its focus halo is 2.16:1.
- `lib/*`, `SampleEmail`, `SampleDigest`, `RecordArtifact`, and every marketing component (the marketing page is off-limits).
- The homeowner `/register`, `/match`, `/why`, `/privacy` and `/terms`.
- Every piece of forbidden content listed in §3.

### Proposed re-skin sequence

**Rules for every packet in the sequence:**

- Restyle our markup in place.
- No component swaps.
- No new dependencies.
- The tests in §6 are not edited, only satisfied.
- Each packet runs the mobile e2e checks, and the desktop screenshot compare at `PW_DESKTOP_COMPARE=1`. That compare is expected to change, and the before/after goes in the PR.

| Packet | Scope | Why this order |
|---|---|---|
| **OR-028** | Tokens and base only: `src/app/globals.css` gains the palette, radii and tracking, with the dark `@media` kept. `layout.tsx` loads Inter and Fraunces. A shared class module extends the existing `src/app/app/people/ui.ts` (`buttonClass`, `linkClass`, `mutedClass`): min-h-11 controls, `ring-2 ring-blue` focus, and no text under 15px. No screen markup changes. | Every later packet consumes these. Doing it alone means one diff to review for contrast (every pair checked against 4.5:1) and one desktop screenshot sweep. |
| **OR-029** | Top bar and app shell (`src/app/app/layout.tsx`, the top bar) | The smallest screen, covered by one test (`top-bar.test.ts`, which pins `flex-nowrap`). Proves the tokens on every `/app` page at once. |
| **OR-030** | `/app` dashboard: HomeSendCard, CallListSection, HomeownersSection | The most-tested screen (16 tests). No new sections: the export's groups list and MiniFact tiles stay out. |
| **OR-031** | People list, person detail and edit | 11 tests. Delete copy, columns and URL filters stay; only the visual changes. |
| **OR-032** | Review queue | Held to 15px/22px by its test; the export's `/match` is reference at most |
| **OR-033** | Add-ons | The off-row test forbids the export's badge swap; keep the switch as the only difference |
| **OR-034** | Settings and billing | The preview stays the real `loadSettingsPreview` iframe path |
| **OR-035** | `/app/start` and import | No export equivalent; restyle only, and keep the status/alert semantics and `MlsAttribution` |
| Later / separate | `/login`, `/register`, `/u/[token]` (server HTML, its own CSS), `/sample` | `/u` is not React and needs its own small packet. The marketing page and `/admin` stay out of the re-skin. |

**Where I would start:** OR-028, the tokens alone, after the Director's v0 design-system prompt settles the three open token questions:

1. A text-safe coral and green (the current values are 3.35:1 and 3.39:1 on white).
2. Whether Fraunces is used in-app or only on marketing.
3. Whether the body background becomes `--surface #f2f5fa` (it is white today) or stays white.
