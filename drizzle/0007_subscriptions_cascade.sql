ALTER TABLE "contact_subscriptions" DROP CONSTRAINT "contact_subscriptions_contact_id_contacts_id_fk";
--> statement-breakpoint
ALTER TABLE "contact_subscriptions" ADD CONSTRAINT "contact_subscriptions_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;