#!/bin/bash

set -euo pipefail

DATABASE_URL="${DATABASE_URL:-}"

if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL is not set; PostgreSQL migrations run at deployment or startup."
    exit 0
fi

case "$DATABASE_URL" in
    postgresql://*|postgres://*) ;;
    *)
        echo "DATABASE_URL must use PostgreSQL." >&2
        exit 1
        ;;
esac

echo "PostgreSQL database target verified; no file database is packaged."
