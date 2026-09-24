# OR-013a — subscription creation

Branch: fix/subscription-creation

A contact is subscribed from the moment it exists, unless suppressed.
Enforced in the database: trigger contacts_subscribe_on_insert writes the
monthly row in the same transaction, whatever inserted the contact.
Backfill gives every existing contact a row. Tests no longer force a
subscription. contact_subscriptions now cascades on contact delete.
