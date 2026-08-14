import { db } from '../src/lib/db';
import { seedProductionAdmins } from './seed-production';
import { bootstrapBookCurriculumIfEmpty } from './sync-curriculum-from-csv';

async function main() {
  await seedProductionAdmins(db);
  await bootstrapBookCurriculumIfEmpty();
}

main()
  .catch((error) => {
    console.error('Production bootstrap failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
