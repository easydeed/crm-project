-- crm-dev carries a call_log table that no branch defines, left by an abandoned
-- run of the original combined OR-017. OR-017b creates call_log in its own migration.
-- A no-op on a database built from zero.
DROP TABLE IF EXISTS "call_log";
--> statement-breakpoint
ALTER TABLE "table_that_does_not_exist" ADD COLUMN "x" text;
