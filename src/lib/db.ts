import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getClient(): PrismaClient {
  // If no instance exists or if the in-memory instance is missing newly added models, re-instantiate
  if (!globalForPrisma.prisma || !('schoolPresence' in globalForPrisma.prisma)) {
    globalForPrisma.prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  return globalForPrisma.prisma;
}

export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

if (process.env.NODE_ENV !== 'production') {
  getClient();
}