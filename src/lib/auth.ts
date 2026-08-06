// Auth utilities for Node.js runtime (API routes)
import crypto from 'crypto';

// Secret key for HMAC signing — derive from env or use a dev default
const AUTH_SECRET = process.env.AUTH_SECRET || 'reval-dev-secret-change-in-production';

// Token expiry: 24 hours in seconds
const TOKEN_EXPIRY_SECONDS = 86400;

/**
 * Generate a signed session token for a given userId.
 * Token format: base64(userId|expiryTimestamp|hmacSignature)
 * Uses Node.js crypto — only call from API routes (Node.js runtime).
 */
export function generateToken(userId: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS;
  const payload = `${userId}|${expiresAt}`;
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payload)
    .digest('hex');

  const token = Buffer.from(`${payload}|${signature}`).toString('base64');
  return token;
}

/**
 * Verify a session token (Node.js runtime — for use in API routes).
 * Returns { userId } if valid and not expired, null otherwise.
 */
export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split('|');
    if (parts.length !== 3) return null;

    const [userId, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    // Check expiry
    if (isNaN(expiresAt) || Math.floor(Date.now() / 1000) > expiresAt) {
      return null;
    }

    // Verify HMAC signature
    const payload = `${userId}|${expiresAt}`;
    const expectedSignature = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(payload)
      .digest('hex');

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

/**
 * Get the AUTH_SECRET (shared with edge-auth)
 */
export function getAuthSecret(): string {
  return AUTH_SECRET;
}
