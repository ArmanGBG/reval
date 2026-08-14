import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { PrismaClient } from '@prisma/client';
import { db } from '../src/lib/db';

const superAdmins = [
  { phone: '09390712416', name: 'سوپر ادمین' },
  { phone: '09396517673', name: 'سوپر ادمین دوم' },
];

export async function seedProductionAdmins(client: PrismaClient = db) {
  for (const admin of superAdmins) {
    await client.user.upsert({
      where: { phone: admin.phone },
      update: {
        role: 'SUPER_ADMIN',
        isActive: true,
        deletedAt: null,
      },
      create: {
        phone: admin.phone,
        name: admin.name,
        avatar: '👑',
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });
    console.log(`Super admin ready: ${admin.phone}`);
  }
}

const isDirectExecution = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false;

if (isDirectExecution) {
  seedProductionAdmins()
    .catch((error) => {
      console.error('Production admin seed failed:', error);
      process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
}
