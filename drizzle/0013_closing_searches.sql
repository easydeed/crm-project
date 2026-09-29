CREATE TABLE "closing_searches" (
	"account_id" uuid PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"listings" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "closing_searches" ADD CONSTRAINT "closing_searches_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;