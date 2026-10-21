DROP INDEX "jobs_kind_payload_key_run_after_uidx";--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "enqueued_for" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "monthly_cents" integer;--> statement-breakpoint
UPDATE "jobs" SET "enqueued_for" = "run_after";--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_kind_payload_key_enqueued_for_uidx" ON "jobs" USING btree ("kind","payload_key","enqueued_for");