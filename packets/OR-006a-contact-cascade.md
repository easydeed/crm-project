# OR-006a — contact cascade

Branch: fix/contact-cascade

Delete is a soft delete (contacts.deleted_at). Every read of contacts
goes through src/db/live-contacts.ts: liveContacts by default,
contactsIncludingDeleted only for the readers named in
INCLUDE_DELETED_READERS, contactsTable only as a write target. A source
test fails the build otherwise. Every FK declares ON DELETE; deleting an
account removes everything it owns. Re-import restores a deleted row.
The erasure path is specified in docs/ERASURE.md, not built.
