import { db } from '../src/lib/db';
import { runBookCurriculumImport } from './sync-curriculum-from-csv';

runBookCurriculumImport()
  .catch((error) => {
    console.error('Book curriculum import failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
