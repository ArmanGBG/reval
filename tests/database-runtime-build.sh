#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/../.zscripts" && pwd)"
TEST_ROOT="$(mktemp -d)"
trap 'rm -rf "$TEST_ROOT"' EXIT

PROJECT_DIR="$TEST_ROOT/project"
BUILD_DIR="$TEST_ROOT/build"
mkdir -p "$PROJECT_DIR"

if DATABASE_URL="mysql://user:password@localhost:3306/reval" \
    PROJECT_DIR="$PROJECT_DIR" BUILD_DIR="$BUILD_DIR" \
    bash "$SCRIPT_DIR/database-runtime-build.sh" >"$TEST_ROOT/invalid.out" 2>&1; then
    echo "non-PostgreSQL database URLs must be rejected" >&2
    exit 1
fi

DATABASE_URL="postgresql://user:password@localhost:5432/reval?schema=public" \
    PROJECT_DIR="$PROJECT_DIR" BUILD_DIR="$BUILD_DIR" \
    bash "$SCRIPT_DIR/database-runtime-build.sh" >"$TEST_ROOT/postgres.out"

test ! -e "$BUILD_DIR/db"
grep -F "PostgreSQL database target verified" "$TEST_ROOT/postgres.out" >/dev/null

echo "database runtime build checks passed"
