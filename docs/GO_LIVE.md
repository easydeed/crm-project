# Go-live checklist

**Specification only.** Each item is done by a person in a dashboard, or by a packet where it says so. Nothing here is done by this document.

## Support

- [ ] **`help@onrecord.com` exists and someone reads it.** It is in `src/config/support.ts` and is the only way back for an agent whose sending was paused automatically. A bounce there reads as being ignored, which is worse than a link that looks broken.

## Stripe

- [ ] **Lift the `sk_test_` enforcement by a packet.** `StripeGateway` refuses any key that is not `sk_test_`. Lifting it is a code change with its own review, never an env flip.
- [ ] **Clear the test-mode subscription rows before the live key goes in.** Every `subscriptions` row written in test mode names a `sub_` id the live account has never seen. Read with the live key, each one is a 404, and its agent's Billing page shows "We can't find your plan." (OR-044a). Delete those rows, or point their accounts at real live subscriptions, in the same change that lifts the `sk_test_` guard.
- [ ] **Failed payment moves the subscription out of `active`.** In the Stripe dashboard, subscription behavior on failed payment must end in `past_due` or `unpaid`. Otherwise `past_due` never fires and sending never pauses for a failed card.
- [ ] **The webhook endpoint sends exactly these four events:** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
- [ ] **Deployed env:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`.

## Vercel

- [ ] **Pro plan, and the cron back to every minute.** `vercel.json` carries `0 9 * * *` for a Hobby preview (OR-049). The send pipeline was built for every-minute ticks. On a daily tick every send goes out the day after the dashboard says it will, retries stretch from 36 minutes to three days, and the 10-jobs-per-tick limit caps the service at roughly three accounts' sends per day. Production requires Pro and a minute-by-minute schedule. This is not a soft preference. Vercel runs the schedule in UTC, so `0 9 * * *` is 01:00 or 02:00 Pacific. When the schedule goes back to `* * * * *`, delete this item: `src/jobs/cron-schedule.test.ts` fails while it describes a schedule `vercel.json` no longer carries.

## Links and mail

- [ ] **Deployed env:** `UNSUBSCRIBE_SECRET`, `APP_ORIGIN`, `MAIL_FROM_MONTHLY`. Without `APP_ORIGIN`, unsubscribe links fall back to localhost.
- [ ] **`SEND_ENABLED` stays `false`** until the S2 gate passes on real parcel data. `SEND_ALLOWLIST` narrows real sends while it is being proven.

## Texting

- [ ] **`TEXTING_ENABLED` stays `false`** until everything below is done.
- [ ] **A2P 10DLC brand and campaign registration** (or toll-free verification) for the sending number. US carriers filter unregistered application-to-person traffic, so an unregistered number's texts are dropped or blocked without an error we can see.
- [ ] **Deployed env:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`.
- [ ] **The Twilio messaging webhook** points at `/api/webhooks/twilio`, so STOP and delivery status reach us.

## Account deletion

- [ ] **No screen deletes an account yet.** An account that ever subscribed must be removed in Stripe first (`docs/ERASURE.md`). Exposing deletion is its own packet.
