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

## Jobs

- [ ] **`CRON_SECRET` is set in the Vercel project.** Vercel sends it on every cron call as `Authorization: Bearer …`, and `/api/cron/tick` answers 404 without it. Until OR-051 the route answered POST only and Vercel calls GET, so no cron had ever reached the job runner.
- [ ] **Crons run against the production deployment only.** A preview deployment never runs the job runner. A Hobby plan lands a run anywhere in the scheduled hour. Delivery is best effort: a run can be missed or repeated. A repeat is safe, because each job is idempotent, and a job already queued is still due at the next tick. Scheduling is not, and this is a product defect, not a plan limit (`docs/ui-spec/05-open.md` #31): a month's send is queued only by a tick that succeeds on the send day (compose, the day before). A send day with no successful tick loses that month's note, with no error, no retry and no record. On one run a day that is one missed run. On any plan it is any outage, broken deploy or missing `CRON_SECRET` that spans the day, and the 405 above would have done it every month.
