# Settings — `/app/settings`

**Capture:** settings (390 and 1440)

## What the agent came here to do

Fix their own details (name, brokerage, DRE licence number, phone, MLS agent id), change how the
monthly email looks to homeowners (sender name, reply-to, accent colour) while watching a live
preview, choose when it sends or pause it, verify a phone for texts, and find the way to billing.

## Layout

Top to bottom (`src/app/app/settings/page.tsx:38-51`), a single `flex-col gap-10` column:

1. App top bar and "Log out" (shared shell).
2. `<h1>` "Settings", 22px.
3. **Your details** form (`details-form.tsx:23-97`): Full name, Email (read-only text, not an
   input), Brokerage, DRE number, Phone, MLS agent ID with a muted helper, the link
   "Find my closings again", and its own Save button.
4. **Phone for texts** (`phone-verification.tsx:67-77`), anchored `id="phone"` so the add-ons
   page can link straight to it (`/app/settings#phone`, `src/addons/text-call-list.ts:30`).
5. **How the email looks** form plus **Preview** (`appearance-form.tsx:30-93`): sender name,
   reply-to, five accent swatches, Save; the preview of the real email beside it.
6. **Sending** form (`sending-form.tsx:22-92`): Send day, Time of day, Timezone (all selects),
   "Pause my monthly note" checkbox with a muted line under it, Save.
7. **Billing**: an `<h2>` and one link, "Plan, card, invoices, and canceling" (`page.tsx:44-51`).

Every form is `max-w-xl` (576px). Inputs are the shared `fieldClass` (block, full width up to
`max-w-sm`, 384px), so labels sit above inputs. Each Save is `buttonClass` in a `flex-col` form,
so it stretches to the form's width (capture: settings, desktop shows 576px-wide Save bars).

**1440 vs 390.** The only breakpoint is `lg:grid-cols-2` on the appearance block
(`appearance-form.tsx:30`): from 1024px the preview sits in a right-hand column beside
"How the email looks"; below that it stacks under the form. The preview frame has a
Desktop/Phone width toggle (600 or 380px) capped by `max-w-full` (`src/app/digest/preview-panel.tsx:70-78`).
On phones, accent swatch labels get `max-sm:-m-1 max-sm:p-1` to reach 44px
(`appearance-form.tsx:57`), the pause label `max-sm:min-h-11` (`sending-form.tsx:73`), and
standalone links use `.tap` (`page.tsx:47`, `details-form.tsx:85`).

## Controls

| Label (quoted) | What it does | Disabled look / when | Focus after |
|---|---|---|---|
| `Full name`, `Brokerage`, `DRE number`, `Phone`, `MLS agent ID` (`details-form.tsx:25-83`) | Inputs saved by this form's Save. Phone shows formatted (`formatUsPhone`). Changing the phone clears verification and, if "Text me the call list" was on, turns it off and says so (`save.ts:38-41`). | Never disabled; in view-as they stay editable but Save is disabled. | — |
| `Find my closings again` (`details-form.tsx:85-87`) | Goes to signup step 2 (`/app/start`), prefilled with the saved MLS id (`src/signup/start-href.ts:2-4`). Running a search there saves the id back to the account (`src/signup/closings.ts:47`). | — | Navigates. |
| `Save` / `Saving…` / `Saved` (`save-button.tsx:25-31`), one per form | Submits that form only. `Saved` shows for 2 seconds, then back to `Save`. | `buttonClass` → `disabledClass` (surface fill, muted words, inset ring) while saving and always in view-as. | No focus change; no `focus()` in this folder. |
| `Text me a code` → `Send a new code` (`phone-verification.tsx:26-39`) | Texts a six-digit code to the saved phone. Not rendered in view-as. | `disabledClass` while sending. | — |
| `Code` input + `Confirm` (`phone-verification.tsx:54-60`) | Appears after a code was sent; confirms it. The code input keeps its own narrow `inputClass` (`w-40`, wide letter spacing) on purpose (OR-034 packet). | `Confirm` disabled while checking. | — |
| `Sender name`, `Reply-to email` (`appearance-form.tsx:33-52`) | Sender name is controlled: each keystroke updates the preview's From line. Reply-to is saved only. | — | — |
| `Accent color` swatches, accessible names `blue`, `green`, `rust`, `ink`, `violet` (`src/config/settings.ts:3-9`) | Radio inputs drawn as 36px squares; the checked one gets a `--foreground` outline. Changes the preview immediately. | — | — |
| `Preview size`: `Desktop` / `Phone`; `Preview format`: `Email` / `Plain text` (`preview-panel.tsx:51-68`) | Toggle buttons with `aria-pressed`; switch the iframe width or show the plain-text version. Only render when the preview has an email to show. | — | — |
| `Send day` (`1st`, `15th`), `Time of day` (`06:00`–`18:00`), `Timezone` (five US zones) (`sending-form.tsx:24-71`) | Selects saved by the Sending Save. | — | — |
| `Pause my monthly note` (`sending-form.tsx:73-82`) | Checkbox; when on, nothing sends. Saved with the Sending form. | Native `disabled` (browser default look, no shared class) when the system paused the account or in view-as. | — |
| `Plan, card, invoices, and canceling` (`page.tsx:47-49`) | Link to `/app/settings/billing`. | — | Navigates. |

## States

- **Populated** — captured: settings. Note what the capture shows, because it is not the raw seed:
  `MLS agent ID` reads `CRMLS-P0000`, left there by the start-* captures (the seed value is
  `C01998432`, `src/db/fixtures/la-verne.ts:24`); no accent swatch is selected, because the seed's
  `#1f4d3a` is not one of the five (`la-verne.ts:20` vs `src/config/settings.ts:3-9`); and the
  Preview shows the line `Nothing new on their street this month.` instead of an email frame,
  because the first matched contact has nothing new (`load-settings-preview.ts:16-27`). **No
  capture shows the email preview frame on this page.**
- **Preview with a real email** — the first matched contact's note, re-styled live with the typed
  sender name and chosen accent (`appearance-preview.tsx:19-24`). Not captured.
- **Sample preview** — when the agent has no matched people: the line
  `Sample — add your people to see theirs.` (`src/digest/skip-copy.ts:5`) above a sample note
  (`load-settings-preview.ts:18-21`). Not producible from the seed (it has matched contacts).
- **Phone states** (`phone-verification.tsx:19-65`): no phone →
  `Add your phone above to verify it for texts.`; verified → `<phone> is verified for texts.`;
  unverified → `We text a six-digit code to <phone> to make sure it is yours.` plus the button
  (captured). After sending: `Code sent. It expires in 10 minutes.` Server messages include
  `That code does not match.`, `That code expired. Send a new one.`,
  `Too many tries. Send a new code.`, `You asked for three codes this hour. Try again later.`
  (`src/text/verification.ts:32-69`). Locally texting is off, so `Text me a code` returns
  `We could not send the code. Check the number and try again.` (`verification.ts:53`), which
  blames the number; described from the code, not captured.
- **Phone changed with the call-list add-on on** — notice
  `Your phone changed, so we turned off Text me the call list. Verify the new number to turn it back on.`
  (`verification.ts:76`), `role="status"`. Not producible from the seed.
- **Field errors** (each `role="alert"` under its field, `field.tsx:6-13`):
  `Full name is required.`, `DRE number must be 7 or 8 digits.`,
  `Use a US phone number, like 909-555-0147.`,
  `That doesn't look like an MLS agent ID. It's letters and numbers, with no spaces.`,
  `Reply-to must be a valid email.`, `Pick one of the five accent colors.`,
  `Send day must be the 1st or the 15th.`, `Pick a send time from the list.`,
  `Pick a timezone from the list.` (`src/config/account-fields.ts:5-36`, `src/config/phone.ts:23`, `save.ts:57-79`). Producible; not captured.
- **Paused by the agent** — checkbox ticked, muted line `Nothing sends while this is on. Turn it back on any time.`
- **Paused by us (system pause)** — after a spam-complaint pause by admin (`src/db/system-pause.ts:8-28`):
  checkbox ticked and disabled, muted line
  `We paused your monthly note. Contact us to turn it back on.` (`sending-form.tsx:84-86`). Not producible from the seed.
- **View-as** (admin viewing an agent, read-only): every form shows the muted line
  `Viewing as another agent is read only.` and a disabled Save; `Text me a code` is not rendered.
  The server also refuses (`save.ts:16-17`). Not producible from the seed.
- **Empty** — there is no empty settings page; blank optional fields render as empty inputs.
  Account missing: `We could not load your settings.` with
  `Sign out and sign in again. If it keeps happening, the account may have been removed.` (`page.tsx:21-30`).
- **Loading** — `Loading your settings…` (`loading.tsx:4`). Not captured.
- **Error** — `We couldn't load your settings.`, `Try again, or sign out and sign in.`, `Try again` (`error.tsx:13-21`). Not captured.

## Fixed copy

- `How the email looks` **Fixed** — `settings-ui.test.ts:16`.
- `Loading your settings`, `couldn't load your settings`, `We could not load your settings.` **Fixed** — `settings-ui.test.ts:28-30`.
- `Viewing as another agent is read only.` **Fixed** (as `VIEW_AS_READ_ONLY`) — `save.integration.test.ts:53`.
- `Your phone changed, so we turned off Text me the call list` **Fixed** — `src/text/text.integration.test.ts:125`.
- `Sample — add your people to see theirs.` is required to be wired (`SAMPLE_LABEL`) by `settings-ui.test.ts:24`; the wording itself is not asserted here.
- `We paused your monthly note. Contact us to turn it back on.` — no test on this screen. The dashboard's version of the same message is held without blame by `src/app/admin/sends-ui.test.ts:35`; keep this one consistent with it.
- `Contact us to change your email.` — no test; email is the login and cannot be changed in product.

## Tests that assert on this screen

- `src/app/app/settings/settings-ui.test.ts:8` — the page loads the real preview (`loadSettingsPreview`) for the effective account; "How the email looks" sits in an `lg:grid-cols-2` with the preview; sender name and accent are live state; the preview uses `applyPreviewLook` and `SAMPLE_LABEL`.
- `settings-ui.test.ts:27` — four states.
- `settings-reskin.test.ts:9` — inputs use the shared `fieldClass`; helper lines use `mutedClass`.
- `settings-reskin.test.ts:23` — phone buttons use `buttonClass`, so they show the disabled state while a code sends.
- `settings-reskin.test.ts:30` — links on settings and its error screen use `linkClass`, not a copy.
- `save.integration.test.ts:25` — a view-as save is refused server-side and changes nothing.
- `src/app/disabled-state.test.ts:43` — `save-button.tsx` uses `buttonClass`.
- `src/app/app/top-bar.test.ts:4` — the top bar links to `/app/settings`.
- `src/text/text.integration.test.ts:99, 120` — code verification rules; phone change clears verification and turns the add-on off.
- `e2e/screens.spec.ts:6` with `e2e/checks.ts` — no horizontal scroll at 390, 44px tap targets on phone (inline links exempt), no text under 15px, no clipping. The capture reports none (`e2e/screenshots/*/settings.json` is `[]`). The email inside the preview iframe is not measured (`checks.ts:10`).

## What the v0 export did, and why we did not take it

The export maps to `settings-manager.tsx` (`docs/audits/OR-027-v0-audit.md:123`). Not taken:

- **A hardcoded sample email as the "Live preview"** (`settings-manager.tsx:180-193`), not the
  real render (audit :327). Ours renders the agent's actual next note through the same renderer
  that sends (OR-034 packet: "The preview stays the real `loadSettingsPreview` iframe path", audit :460).
- **Invisible labels**: `text-muted` resolves to `--surface`, near-white on white, 1.09:1
  (audit :83; `settings-manager.tsx:92, 121, 156, 180`).
- **A pause switch that toasts** "Sending paused." (`settings-manager.tsx:151-166`) and a
  "Save settings" button that only toasts (`:169-171`): dead controls under invariant 1, and
  `sonner` is not a dependency. The export has no system pause at all, only the agent's own switch (audit :362).
- **One Save for everything**, 36–40px fields and 12.5px labels (audit :213, :215, :227).
- **No four states** (audit :328) and **no billing screens** (audit :123, :139).
