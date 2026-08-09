// Auth utilities for Edge Runtime (middleware)
// This file uses ONLY Web Crypto API — no Node.js 'crypto' module

const AUTH_SECRET = process.env.AUTH_SECRET || 'reval-dev-secret-change-in-production';

if (process.env.NODE_ENV === 'production' && !process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET is required in production');
}

/**
 * Verify a session token using Web Crypto API (Edge runtime — for middleware).
 * Returns { userId } if valid and not expired, null otherwise.
 */
export async function verifyTokenEdge(token: string): Promise<{ userId: string } | null> {
  try {
    const decoded = atob(token);
    const parts = decoded.split('|');
    if (parts.length !== 3) return null;

    const [userId, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    // Check expiry
    if (isNaN(expiresAt) || Math.floor(Date.now() / 1000) > expiresAt) {
      return null;
    }

    // Verify HMAC signature using Web Crypto API
    const payload = `${userId}|${expiresAt}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(AUTH_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const sigArray = Array.from(new Uint8Array(sigBuffer));
    const expectedSignature = sigArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (signature !== expectedSignature) {
      return null;
    }

    return { userId };
  } catch {
    return null;
  }
}

/**
 * Cookie name for the session token
 */
export const SESSION_COOKIE_NAME = 'reval-session';
