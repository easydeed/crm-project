# OR-021 — add-on framework

```
TASK: OR-021
BRANCH: feat/addon-framework

OBJECTIVE
A registry of add-ons, a page to switch them on and off, and a bill that
reflects what is on. No add-on behavior in this packet.

WHY
Slice S7. Every later add-on hangs off this. Built alone so the shape is
right before anything uses it.

SCOPE
- src/addons/ — registry, types, state
- /app/addons
- Bill total against the $19 base
- Out of scope: any add-on's actual behavior (OR-022, OR-023), Stripe
  line items for add-ons, usage metering

DESIRED BEHAVIOR

1. The registry — src/addons/registry.ts

   type Addon = {
     key: string
     title: string            // plain language, agent-facing
     blurb: string            // one sentence
     priceCents: number       // 0 for free
     priceNote?: string       // e.g. "+ postage", "250 included"
     band: 'extras' | 'texting'
     requiresConfig: boolean
     configSchema?: ZodSchema
     onEnable?(accountId, config): Promise<void>
     onDisable?(accountId): Promise<void>
   }

   One registry, keyed by string. Registering the same key twice fails at
   startup. An add-on not in the registry cannot be enabled, even if a
   row exists for it — a stale account_addons row for an unknown key is
   ignored and reported to admin, never crashes a page.

2. State — account_addons already exists (account_id, addon_key, enabled,
   config jsonb, enabled_at). Add a required src/addons/state.ts that is
   the only module reading or writing it, same pattern as live-contacts.
   Every function takes accountId.

   isAddonEnabled(accountId, key) is the single check any feature uses.
   A disabled or unknown add-on returns false.

3. /app/addons — two bands, as specced in the marketing page

   "Extras" ($2–$4) and "Texting your clients" ($9), each with a heading
   line. Under the texting heading, in muted text:
   "Phone carriers charge us to send text messages to people, and they
   make us register first. That's why this one costs more."

   Each row: title, blurb, price, and a switch. Full contrast whether on
   or off — a switched-off add-on must not look unavailable. The switch
   is the only thing that changes appearance.

   This packet registers no add-ons, so the page renders its empty state:
   "Nothing extra yet. We'll add things here." Build the row component
   and prove it with a test-only fixture add-on that is not registered in
   production code.

4. Config-gated add-ons

   When requiresConfig is true, switching on expands an inline form built
   from configSchema. The switch cannot latch until the config validates.
   Attempting it shows an inline message, not a toast.

   Switching off keeps the stored config, so switching back on does not
   re-ask. Say so in one muted line.

5. The bill

   A summary at the bottom: base $19, then each enabled add-on as a line,
   then a total. It updates live as switches flip. Only enabled add-ons
   appear. Keep the dark bar treatment from the prototype.

   This is display only. Stripe line items for add-ons are a later
   packet — note that on the page in muted text: "Changes take effect on
   your next bill."

6. Admin — /admin/accounts/[id] lists that account's enabled add-ons with
   their config. Read-only except the existing force-enable, which must
   respect requiresConfig the same way.

ACCEPTANCE CRITERIA
1. Registering a duplicate key fails at startup, proven by test
2. An account_addons row for an unknown key is ignored, does not crash
   any page, and is surfaced to admin
3. isAddonEnabled is the only path any feature uses to check state,
   enforced by a source test on account_addons access
4. A config-gated add-on cannot latch on with invalid config, proven
   server-side, not only by a disabled button
5. Switching off and on again preserves the stored config
6. The bill total is correct for every combination of enabled add-ons
7. A switched-off row renders at full contrast, proven by a UI test
8. The empty state renders when nothing is registered
9. Every add-on state function takes accountId as a required parameter
10. assertWritable guards every switch action, so view-as cannot toggle
11. pnpm verify passes, CI green before merge

DO NOT
- Register any real add-on
- Add Stripe line items
- Build texting or lender behavior
- Add a dependency
```
