// ============================================================
// sync-dev-schema.mjs
// ============================================================
// Generates `prisma/schema.dev.prisma` from `prisma/schema.prisma`
// by swapping the `provider = "postgresql"` line to `provider = "sqlite"`.
//
// Why we need this:
// - Production (Liara) uses PostgreSQL.
// - Local dev in this environment uses SQLite (no Docker / psql available).
// - Prisma requires the `provider` field to be a static literal — it CANNOT
//   be parameterized via env var. So we must keep two physical schema files.
//
// To avoid drift (someone edits schema.prisma and forgets schema.dev.prisma),
// we regenerate schema.dev.prisma on every `npm run dev` / `db:setup:dev`.
// The dev file is committed to git so a fresh clone can run `npm run dev`
// without first running the sync — but it is the source of truth ONLY for
// local dev. Production always reads `prisma/schema.prisma` (postgres).
//
// Output path: `prisma/schema.dev.prisma` (in the same directory so
// `import { PrismaClient } from '@prisma/client'` works regardless of
// which schema was used to generate the client).
// ============================================================

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.join(root, 'prisma', 'schema.prisma');
const destPath = path.join(root, 'prisma', 'schema.dev.prisma');

const source = readFileSync(sourcePath, 'utf8');

// Swap the datasource provider from postgresql to sqlite.
// Match either `provider = "postgresql"` or `provider = "postgres"`.
const devContent = source.replace(
  /provider\s*=\s*"postgres(?:ql)?"/,
  'provider = "sqlite"',
);

if (devContent === source) {
  console.error('sync-dev-schema: did not find a postgresql provider line to swap. Aborting.');
  process.exit(1);
}

writeFileSync(destPath, devContent);
console.log(`✓ Wrote ${path.relative(root, destPath)} (provider = "sqlite")`);
