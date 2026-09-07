#!/bin/sh
# Entrypoint for the SplittyTest image.
#
#   api            start the API server (default)
#   migrate        run store (Postgres/SQLite) then OLAP (ClickHouse/DuckDB) migrations
#   migrate:store  run only the store migrations
#   migrate:olap   run only the OLAP migrations
#   <anything>     exec'd as-is (e.g. `sh`)
#
# Database targets are chosen by STORE_TYPE / OLAP_TYPE (see api/config).
set -eu

cd /app

run_migration() {
    echo "[entrypoint] running ${1} migrations (STORE_TYPE=${STORE_TYPE:-postgres}, OLAP_TYPE=${OLAP_TYPE:-clickhouse})"
    MIGRATOR_TYPE="$1" tsx migrate/migrate.ts
}

cmd="${1:-api}"
case "$cmd" in
    api)
        shift
        exec node dist/server.js "$@"
        ;;
    migrate)
        run_migration store
        run_migration olap
        ;;
    migrate:store)
        run_migration store
        ;;
    migrate:olap)
        run_migration olap
        ;;
    *)
        exec "$@"
        ;;
esac
