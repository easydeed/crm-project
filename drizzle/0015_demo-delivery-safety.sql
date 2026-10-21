ALTER TABLE "send_recipients" ADD COLUMN "composed_fingerprint" text;--> statement-breakpoint
ALTER TABLE "send_recipients" ADD COLUMN "delivery_claimed_at" timestamp with time zone;