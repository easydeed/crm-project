ALTER TABLE "account_addons" DROP CONSTRAINT "account_addons_account_id_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_actions" DROP CONSTRAINT "admin_actions_admin_account_id_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_actions" DROP CONSTRAINT "admin_actions_target_account_id_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "contact_match_candidates" DROP CONSTRAINT "contact_match_candidates_parcel_id_parcels_id_fk";
--> statement-breakpoint
ALTER TABLE "contacts" DROP CONSTRAINT "contacts_account_id_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "contacts" DROP CONSTRAINT "contacts_parcel_id_parcels_id_fk";
--> statement-breakpoint
ALTER TABLE "events" DROP CONSTRAINT "events_send_id_sends_id_fk";
--> statement-breakpoint
ALTER TABLE "groups" DROP CONSTRAINT "groups_account_id_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "parcel_events" DROP CONSTRAINT "parcel_events_parcel_id_parcels_id_fk";
--> statement-breakpoint
ALTER TABLE "send_recipients" DROP CONSTRAINT "send_recipients_send_id_sends_id_fk";
--> statement-breakpoint
ALTER TABLE "sends" DROP CONSTRAINT "sends_account_id_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "call_list_entries" DROP CONSTRAINT "call_list_entries_account_id_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "call_list_entries" DROP CONSTRAINT "call_list_entries_contact_id_contacts_id_fk";
--> statement-breakpoint
ALTER TABLE "call_log" DROP CONSTRAINT "call_log_account_id_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_actions" ALTER COLUMN "target_account_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "account_addons" ADD CONSTRAINT "account_addons_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_admin_account_id_accounts_id_fk" FOREIGN KEY ("admin_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_target_account_id_accounts_id_fk" FOREIGN KEY ("target_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_match_candidates" ADD CONSTRAINT "contact_match_candidates_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_send_id_sends_id_fk" FOREIGN KEY ("send_id") REFERENCES "public"."sends"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_events" ADD CONSTRAINT "parcel_events_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "send_recipients" ADD CONSTRAINT "send_recipients_send_id_sends_id_fk" FOREIGN KEY ("send_id") REFERENCES "public"."sends"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sends" ADD CONSTRAINT "sends_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_list_entries" ADD CONSTRAINT "call_list_entries_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_list_entries" ADD CONSTRAINT "call_list_entries_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_log" ADD CONSTRAINT "call_log_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;