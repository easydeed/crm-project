# OR-014a — suppression list

Branch: fix/suppression-list

An opt-out survives the contact who created it. suppressions holds the
sha256 of the address (never the address), a reason, and a scope.
Written by the unsubscribe page, one-click, and the Postmark webhook;
checked at compose, in assertSendAllowed, and at import. Backfilled from
every unsubscribed_at and every bounce or complaint in mail_events.
