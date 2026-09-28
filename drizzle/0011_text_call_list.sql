CREATE TYPE "public"."text_kind" AS ENUM('call_list', 'verify', 'stop_received');--> statement-breakpoint
CREATE TABLE "phone_verifications" (
	"account_id" uuid PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "text_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"kind" text_kind NOT NULL,
	"period" text,
	"to_phone" text NOT NULL,
	"provider_id" text,
	"error" text,
	"permanent_failure" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "phone_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "phone_verifications" ADD CONSTRAINT "phone_verifications_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "text_messages" ADD CONSTRAINT "text_messages_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "text_messages_call_list_account_period_uidx" ON "text_messages" USING btree ("account_id","period") WHERE "text_messages"."kind" = 'call_list';--> statement-breakpoint
CREATE INDEX "text_messages_account_created_idx" ON "text_messages" USING btree ("account_id","created_at");--> statement-breakpoint
CREATE INDEX "text_messages_provider_id_idx" ON "text_messages" USING btree ("provider_id");