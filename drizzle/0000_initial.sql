CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TYPE "public"."account_role" AS ENUM('agent', 'admin');--> statement-breakpoint
CREATE TYPE "public"."contact_match_source" AS ENUM('auto', 'review', 'corrected');--> statement-breakpoint
CREATE TYPE "public"."contact_no_parcel_kind" AS ENUM('non_address', 'unmatched');--> statement-breakpoint
CREATE TYPE "public"."contact_review_state" AS ENUM('pending', 'reviewed');--> statement-breakpoint
CREATE TYPE "public"."contact_status" AS ENUM('matched', 'needs_review', 'no_parcel');--> statement-breakpoint
CREATE TYPE "public"."event_kind" AS ENUM('opened', 'clicked');--> statement-breakpoint
CREATE TYPE "public"."subscription_scope" AS ENUM('monthly', 'weekly');--> statement-breakpoint
CREATE TABLE "account_addons" (
	"account_id" uuid NOT NULL,
	"addon_key" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enabled_at" timestamp with time zone,
	CONSTRAINT "account_addons_account_id_addon_key_pk" PRIMARY KEY("account_id","addon_key")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"brokerage" text,
	"dre" text,
	"phone" text,
	"role" "account_role" NOT NULL,
	"sender_name" text,
	"reply_to" text,
	"accent_color" text,
	"send_day" integer,
	"send_time" text,
	"timezone" text,
	"paused" boolean DEFAULT false NOT NULL,
	"last_logged_in_at" timestamp with time zone,
	"mls_agent_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "admin_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_account_id" uuid,
	"target_account_id" uuid NOT NULL,
	"action" text NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_match_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"parcel_id" uuid NOT NULL,
	"confidence" double precision NOT NULL,
	"reason" text NOT NULL,
	"rank" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_subscriptions" (
	"contact_id" uuid NOT NULL,
	"scope" "subscription_scope" NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	CONSTRAINT "contact_subscriptions_contact_id_scope_pk" PRIMARY KEY("contact_id","scope")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"address_raw" text NOT NULL,
	"parcel_id" uuid,
	"close_date" date,
	"notes" text,
	"homeowner_address_at" timestamp with time zone,
	"status" "contact_status" NOT NULL,
	"review_state" "contact_review_state" DEFAULT 'pending' NOT NULL,
	"match_source" "contact_match_source" DEFAULT 'auto' NOT NULL,
	"no_parcel_kind" "contact_no_parcel_kind",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"send_id" uuid NOT NULL,
	"kind" "event_kind" NOT NULL,
	"section" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"group_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	CONSTRAINT "group_members_group_id_contact_id_pk" PRIMARY KEY("group_id","contact_id")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"payload_key" text NOT NULL,
	"run_after" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"locked_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "mail_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"email" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mls_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mls_id" text NOT NULL,
	"zip" text NOT NULL,
	"address" text NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"status" text NOT NULL,
	"list_price" integer,
	"list_date" date,
	"close_price" integer,
	"close_date" date,
	"beds" integer,
	"baths" numeric,
	"sqft" integer,
	"property_type" text,
	"listing_office" text,
	"listing_agent" text,
	"fetched_at" timestamp with time zone,
	CONSTRAINT "mls_listings_mls_id_unique" UNIQUE("mls_id")
);
--> statement-breakpoint
CREATE TABLE "parcel_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parcel_id" uuid NOT NULL,
	"county" text NOT NULL,
	"kind" text NOT NULL,
	"doc_number" text NOT NULL,
	"recorded_at" date NOT NULL,
	"amount" integer,
	"party" text,
	"raw" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parcels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"apn" text NOT NULL,
	"county" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"zip" text NOT NULL,
	"street_name_norm" text DEFAULT '' NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"beds" integer,
	"baths" numeric,
	"sqft" integer,
	"year_built" integer,
	"use_code" text,
	"assessed_value" integer,
	"base_year" integer,
	"base_year_value" integer,
	"last_refreshed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "send_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"send_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"html" text,
	"plain_text" text,
	"subject" text,
	"error" text,
	"permanent_failure" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp with time zone,
	"provider_id" text
);
--> statement-breakpoint
CREATE TABLE "sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"state" text NOT NULL,
	"composed_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"skips" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"account_id" uuid PRIMARY KEY NOT NULL,
	"stripe_customer_id" text,
	"stripe_sub_id" text,
	"plan" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "call_list_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"detail" text NOT NULL,
	"score" integer NOT NULL,
	"period" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_addons" ADD CONSTRAINT "account_addons_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_admin_account_id_accounts_id_fk" FOREIGN KEY ("admin_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_target_account_id_accounts_id_fk" FOREIGN KEY ("target_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_match_candidates" ADD CONSTRAINT "contact_match_candidates_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_match_candidates" ADD CONSTRAINT "contact_match_candidates_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_subscriptions" ADD CONSTRAINT "contact_subscriptions_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_send_id_sends_id_fk" FOREIGN KEY ("send_id") REFERENCES "public"."sends"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_events" ADD CONSTRAINT "parcel_events_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "send_recipients" ADD CONSTRAINT "send_recipients_send_id_sends_id_fk" FOREIGN KEY ("send_id") REFERENCES "public"."sends"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "send_recipients" ADD CONSTRAINT "send_recipients_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sends" ADD CONSTRAINT "sends_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_list_entries" ADD CONSTRAINT "call_list_entries_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_list_entries" ADD CONSTRAINT "call_list_entries_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contact_match_candidates_contact_parcel_uidx" ON "contact_match_candidates" USING btree ("contact_id","parcel_id");--> statement-breakpoint
CREATE UNIQUE INDEX "contacts_account_email_uidx" ON "contacts" USING btree ("account_id",lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "groups_account_name_uidx" ON "groups" USING btree ("account_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_kind_payload_key_run_after_uidx" ON "jobs" USING btree ("kind","payload_key","run_after");--> statement-breakpoint
CREATE UNIQUE INDEX "parcel_events_county_doc_uidx" ON "parcel_events" USING btree ("county","doc_number");--> statement-breakpoint
CREATE UNIQUE INDEX "parcels_county_apn_uidx" ON "parcels" USING btree ("county","apn");--> statement-breakpoint
CREATE INDEX "parcels_zip_idx" ON "parcels" USING btree ("zip");--> statement-breakpoint
CREATE INDEX "parcels_city_address_idx" ON "parcels" USING btree ("city","address");--> statement-breakpoint
CREATE INDEX "parcels_zip_street_name_norm_idx" ON "parcels" USING btree ("zip","street_name_norm");--> statement-breakpoint
CREATE INDEX "parcels_street_name_norm_trgm_idx" ON "parcels" USING gin ("street_name_norm" gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "send_recipients_send_contact_uidx" ON "send_recipients" USING btree ("send_id","contact_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sends_account_scheduled_for_uidx" ON "sends" USING btree ("account_id","scheduled_for");--> statement-breakpoint
CREATE UNIQUE INDEX "call_list_entries_account_contact_period_uidx" ON "call_list_entries" USING btree ("account_id","contact_id","period");