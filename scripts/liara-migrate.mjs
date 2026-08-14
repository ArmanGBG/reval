import { createHash, randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { Client } from 'pg';

const root = process.cwd();
const migrationsDirectory = path.join(root, 'prisma', 'migrations');
const rawDatabaseUrl = process.env.DATABASE_URL;

if (!rawDatabaseUrl) throw new Error('DATABASE_URL is required.');

const databaseUrl = new URL(rawDatabaseUrl);
const schema = databaseUrl.searchParams.get('schema') || 'public';
databaseUrl.searchParams.delete('schema');

if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema)) {
  throw new Error(`Invalid PostgreSQL schema name: ${schema}`);
}

const quotedSchema = `"${schema.replaceAll('"', '""')}"`;
const main = async () => {
  const client = new Client({ connectionString: databaseUrl.toString() });
  await client.connect();
  try {
  await client.query(`CREATE SCHEMA IF NOT EXISTS ${quotedSchema}`);
  await client.query(`SET search_path TO ${quotedSchema}`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) PRIMARY KEY NOT NULL,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    )
  `);

  const entries = (await readdir(migrationsDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const migrationName of entries) {
    const migrationPath = path.join(migrationsDirectory, migrationName, 'migration.sql');
    const sql = await readFile(migrationPath, 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const existing = await client.query(
      'SELECT "checksum", "finished_at", "rolled_back_at" FROM "_prisma_migrations" WHERE "migration_name" = $1 ORDER BY "started_at" DESC LIMIT 1',
      [migrationName],
    );

    if (existing.rows[0]?.finished_at && !existing.rows[0]?.rolled_back_at) {
      if (existing.rows[0].checksum !== checksum) {
        throw new Error(`Migration checksum changed after application: ${migrationName}`);
      }
      console.log(`Migration already applied: ${migrationName}`);
      continue;
    }

    console.log(`Applying migration: ${migrationName}`);
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query(
        `INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
         VALUES ($1, $2, now(), $3, now(), 1)`,
        [randomUUID(), checksum, migrationName],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

    console.log('All database migrations completed successfully.');
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error('Database migration failed:', error);
  process.exitCode = 1;
});
