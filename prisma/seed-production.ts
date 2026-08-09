import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const superAdmins = [
  { phone: '09390712416', name: 'سوپر ادمین' },
  { phone: '09396517673', name: 'سوپر ادمین دوم' },
];

async function main() {
  for (const admin of superAdmins) {
    await prisma.user.upsert({
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
        dailyTargetHours: 0,
        isActive: true,
      },
    });
    console.log(`Super admin ready: ${admin.phone}`);
  }
}

main()
  .catch((error) => {
    console.error('Production admin seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
