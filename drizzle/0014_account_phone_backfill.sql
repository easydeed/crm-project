-- OR-026: accounts.phone as Settings stores it, 10 bare digits (normalizeUsPhone in src/config/phone.ts).
-- A value that is not a US number is left exactly as typed; the notice below counts them.
UPDATE "accounts"
SET "phone" = right(regexp_replace("phone", '\D', '', 'g'), 10)
WHERE "phone" IS NOT NULL
  AND regexp_replace("phone", '\D', '', 'g') ~ '^1?[0-9]{10}$'
  AND "phone" <> right(regexp_replace("phone", '\D', '', 'g'), 10);
--> statement-breakpoint
DO $$
DECLARE left_as_typed integer;
BEGIN
  SELECT count(*) INTO left_as_typed FROM "accounts" WHERE "phone" IS NOT NULL AND "phone" !~ '^[0-9]{10}$';
  RAISE NOTICE 'OR-026 phone backfill: % account phone(s) left as typed (not a US number)', left_as_typed;
END $$;
