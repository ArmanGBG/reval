#!/bin/sh
set -eu

# Liara's Next runtime keeps the standalone output, so copy the files needed by
# the pre-start migration/bootstrap hook explicitly into that output.
STANDALONE_DIR=".next/standalone"

mkdir -p "$STANDALONE_DIR/node_modules" "$STANDALONE_DIR/node_modules/@prisma"
cp -R "node_modules/prisma" "$STANDALONE_DIR/node_modules/"
cp -R "node_modules/tsx" "$STANDALONE_DIR/node_modules/"
cp -R "node_modules/@prisma/engines" "$STANDALONE_DIR/node_modules/@prisma/"
cp -R "prisma" "$STANDALONE_DIR/"
cp "seed - Data.csv" "$STANDALONE_DIR/"

echo "Liara standalone migration runtime prepared."
