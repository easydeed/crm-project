# OR-014b — keep them coming

Branch: fix/keep-them-coming

A homeowner can undo their own unsubscribe. The offer shows only when
every suppression on the address is an 'unsubscribed' row from
unsubscribe_page or one_click. Any bounce or complaint makes it
permanent. A lift is copied to suppression_lifts before the row is
deleted.
