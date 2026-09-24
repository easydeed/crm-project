CREATE TYPE "public"."suppression_reason" AS ENUM('unsubscribed', 'bounced', 'complained');--> statement-breakpoint
CREATE TYPE "public"."suppression_scope" AS ENUM('monthly', 'weekly', 'all');--> statement-breakpoint
CREATE TABLE "suppressions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_hash" text NOT NULL,
	"reason" "suppression_reason" NOT NULL,
	"scope" "suppression_scope" NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "suppressions_email_hash_is_sha256" CHECK ("suppressions"."email_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE UNIQUE INDEX "suppressions_email_hash_scope_uidx" ON "suppressions" USING btree ("email_hash","scope");