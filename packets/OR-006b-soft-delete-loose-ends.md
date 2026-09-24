# OR-006b — soft delete loose ends

Branch: fix/soft-delete-loose-ends

The contacts checker also scans test files and scripts/ for doors into
src, and src may not import from either. The delete confirmation copy
states what really happens. CONTACT_CHILD_TABLES records the live-join
decision for every table referencing contacts, and a test fails the
build when a new one appears without a decision. CLAUDE.md carries the
child-table rule.
