# reference/

Design artifacts. Read from, never built on.

`v0-export/` holds the v0 prototype. It is a visual specification, not
application code — it runs on mock arrays, has no data layer, and no auth.

**Never import from this directory into src/.** Components are harvested
deliberately, by packet, and rewritten against the real schema. The pieces
worth harvesting: ParcelMap, the recorder stamp block, the SampleEmail
renderer, the phone frame, and the design tokens.

Everything else gets rebuilt. That is faster than untangling it.
