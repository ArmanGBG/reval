import crypto from 'crypto';
import { db } from '@/lib/db';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export async function createPublicCode(prefix: 'STU' | 'ADV'): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = Array.from({ length: 6 }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join('');
    const code = `${prefix}-${suffix}`;
    const exists = await db.user.findUnique({ where: { publicCode: code }, select: { id: true } });
    if (!exists) return code;
  }
  throw new Error('PUBLIC_CODE_GENERATION_FAILED');
}
