CREATE TABLE "suppression_lifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_hash" text NOT NULL,
	"reason" "suppression_reason" NOT NULL,
	"scope" "suppression_scope" NOT NULL,
	"original_source" text NOT NULL,
	"suppressed_at" timestamp with time zone NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "suppression_lifts_email_hash_is_sha256" CHECK ("suppression_lifts"."email_hash" ~ '^[0-9a-f]{64}$')
);
