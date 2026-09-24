-- send_recipients and events keep a person's send history, so deleting a contact alone must
-- still fail (NO ACTION). Deferred to commit so deleting an account works: Postgres runs each
-- cascade as its own statement, and accounts -> contacts would otherwise be checked before
-- accounts -> sends -> send_recipients has removed the rows. Drizzle cannot express this.
ALTER TABLE "send_recipients" ALTER CONSTRAINT "send_recipients_contact_id_contacts_id_fk" DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
ALTER TABLE "events" ALTER CONSTRAINT "events_contact_id_contacts_id_fk" DEFERRABLE INITIALLY DEFERRED;
