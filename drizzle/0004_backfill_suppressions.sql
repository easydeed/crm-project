-- Carry every existing opt-out into suppressions, keyed by the same hash the app computes:
-- sha256 of the lowercased, trimmed address. Safe to run twice.

-- Bounces and complaints stop every stream to the address, contact or not.
INSERT INTO "suppressions" ("email_hash", "reason", "scope", "source", "created_at")
SELECT DISTINCT ON (hash)
  hash,
  CASE WHEN kind = 'spam_complaint' THEN 'complained' ELSE 'bounced' END::"suppression_reason",
  'all'::"suppression_scope",
  'backfill',
  created_at
FROM (
  SELECT encode(sha256(convert_to(lower(btrim("email")), 'UTF8')), 'hex') AS hash, "kind", "created_at"
  FROM "mail_events"
  WHERE "kind" IN ('hard_bounce', 'spam_complaint') AND "email" IS NOT NULL AND btrim("email") <> ''
  ORDER BY "created_at"
) AS stops
ORDER BY hash, CASE WHEN kind = 'spam_complaint' THEN 0 ELSE 1 END, created_at
ON CONFLICT ("email_hash", "scope") DO NOTHING;
--> statement-breakpoint
-- Every unsubscribed_at, per scope.
INSERT INTO "suppressions" ("email_hash", "reason", "scope", "source", "created_at")
SELECT DISTINCT ON (hash, scope)
  hash,
  'unsubscribed'::"suppression_reason",
  scope,
  'backfill',
  unsubscribed_at
FROM (
  SELECT
    encode(sha256(convert_to(lower(btrim(c."email")), 'UTF8')), 'hex') AS hash,
    cs."scope"::text::"suppression_scope" AS scope,
    cs."unsubscribed_at"
  FROM "contact_subscriptions" cs
  JOIN "contacts" c ON c."id" = cs."contact_id"
  WHERE cs."unsubscribed_at" IS NOT NULL
) AS stopped
-- An address already stopped for everything keeps its real reason (bounced or complained).
WHERE NOT EXISTS (SELECT 1 FROM "suppressions" s WHERE s."email_hash" = stopped.hash AND s."scope" = 'all')
ORDER BY hash, scope, unsubscribed_at
ON CONFLICT ("email_hash", "scope") DO NOTHING;
