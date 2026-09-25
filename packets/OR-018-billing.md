# OR-018 — Stripe billing and cost per account

Branch: feat/billing

An agent pays $19 a month through Stripe Checkout, at signup or from
Settings → Billing, and can cancel at period end or resume in one click
from an in-product screen (no Customer Portal, no offer, no survey).
The Stripe webhook is signature-verified (404 on a bad signature),
idempotent by event id (stripe_events primary key), and the only writer
of the subscriptions cache. assertSendAllowed refuses an account without
an active subscription; the scheduler treats it like a pause, so call
lists still build and nothing is deleted. /admin/costs shows revenue,
parcel lookups, MLS calls, sends, amortized email and hosting, COGS and
margin per account, worst first, from provider_calls and send_recipients
at the rates in src/config/costs.ts. Every rate ships null ("rate not
set") until someone sets it; the invariant checker refuses a rate or a
live Stripe key anywhere else. PropertyProvider and ListingProvider are
new; withMetering records a provider_calls row per call on any billable
provider. Schema modules are discovered, not listed, by the contact
child-table and foreign-key tests, and drizzle.config must list each.
