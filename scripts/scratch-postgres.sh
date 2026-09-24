#!/usr/bin/env bash
# Starts an empty Postgres with SSL on localhost:5432 for a from-zero build.
# Used by CI. Runs locally on any machine with PostgreSQL and openssl installed.
# Connect with: postgres://postgres@localhost:5432/postgres
set -euo pipefail

BIN=$(ls -d /usr/lib/postgresql/*/bin | sort -V | tail -1)
DIR=${SCRATCH_PG_DIR:-/tmp/onrecord-scratch-pg}

as_root() { if [ "$(id -u)" = 0 ]; then "$@"; else sudo "$@"; fi; }
as_postgres() { as_root su postgres -s /bin/bash -c "$1"; }

if [ -f "$DIR/data/postmaster.pid" ] && as_postgres "$BIN/pg_ctl -D $DIR/data status >/dev/null"; then
  as_postgres "$BIN/pg_ctl -D $DIR/data -w stop >/dev/null"
fi
as_root rm -rf "$DIR"
as_root mkdir -p "$DIR"
as_root chown postgres "$DIR"
as_postgres "$BIN/initdb -D $DIR/data -U postgres --auth=trust >/dev/null"
as_postgres "openssl req -new -x509 -days 2 -nodes -subj /CN=localhost -keyout $DIR/data/server.key -out $DIR/data/server.crt 2>/dev/null && chmod 600 $DIR/data/server.key"
as_postgres "$BIN/pg_ctl -D $DIR/data -o '-c ssl=on -p 5432 -k /tmp' -l $DIR/log -w start >/dev/null"
"$BIN/psql" "postgres://postgres@localhost:5432/postgres?sslmode=require" -tAc 'show ssl' | grep -qx on
echo "Scratch Postgres ready on localhost:5432 with SSL."
