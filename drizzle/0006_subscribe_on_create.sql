-- A contact is subscribed to the monthly note the moment it exists, in the same
-- transaction, whatever created it: import, paste, the seed, or hand-written SQL.
-- A suppressed address gets the row with unsubscribed_at set. The hash must match
-- src/suppression/hash.ts: sha256 of the lowercased, trimmed address.
CREATE OR REPLACE FUNCTION "subscribe_new_contact"() RETURNS trigger AS $$
BEGIN
  INSERT INTO "contact_subscriptions" ("contact_id", "scope", "unsubscribed_at")
  VALUES (
    NEW."id",
    'monthly',
    CASE WHEN EXISTS (
      SELECT 1 FROM "suppressions" s
      WHERE s."email_hash" = encode(sha256(convert_to(lower(btrim(NEW."email")), 'UTF8')), 'hex')
        AND s."scope" IN ('monthly', 'all')
    ) THEN now() ELSE NULL END
  )
  ON CONFLICT ("contact_id", "scope") DO NOTHING;
  RETURN NEW;
END
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER "contacts_subscribe_on_insert"
  AFTER INSERT ON "contacts"
  FOR EACH ROW EXECUTE FUNCTION "subscribe_new_contact"();
--> statement-breakpoint
-- Every existing contact without a monthly row gets one: active unless suppressed.
INSERT INTO "contact_subscriptions" ("contact_id", "scope", "unsubscribed_at")
SELECT
  c."id",
  'monthly',
  CASE WHEN EXISTS (
    SELECT 1 FROM "suppressions" s
    WHERE s."email_hash" = encode(sha256(convert_to(lower(btrim(c."email")), 'UTF8')), 'hex')
      AND s."scope" IN ('monthly', 'all')
  ) THEN now() ELSE NULL END
FROM "contacts" c
WHERE NOT EXISTS (
  SELECT 1 FROM "contact_subscriptions" cs WHERE cs."contact_id" = c."id" AND cs."scope" = 'monthly'
);
