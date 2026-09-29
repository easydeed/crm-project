# Go-live checklist

**Specification only.** Each item is done by a person in a dashboard, or by a packet where it says so. Nothing here is done by this document.

## Support

- [ ] **`help@onrecord.com` exists and someone reads it.** It is in `src/config/support.ts` and is the only way back for an agent whose sending was paused automatically. A bounce there reads as being ignored, which is worse than a link that looks broken.

## Stripe

- [ ] **Lift the `sk_test_` enforcement by a packet.** `StripeGateway` refuses any key that is not `sk_test_`. Lifting it is a code change with its own review, never an env flip.
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
