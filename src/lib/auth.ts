// Auth utilities for Node.js runtime (API routes)
import crypto from 'crypto';
import type { NextRequest } from 'next/server';

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

// ====================================================================
// Session cookie options — cross-site iframe compatible
// --------------------------------------------------------------------
// The preview panel renders the app inside a cross-site iframe
// (preview-chat-*.space-z.ai → app origin). Browsers do NOT send
// SameSite=Lax cookies on cross-site subrequests (e.g. fetch from
// within the iframe), which means every /api/* call after login would
// return 401 → SessionGuard fires "نشست شما منقضی شده" → auto-logout.
//
// Fix: when the request is served over HTTPS (which the preview is,
// via the gateway / reverse proxy), use SameSite=None + Secure so the
// cookie is sent in the cross-site iframe context. For direct HTTP
// localhost access (dev), keep SameSite=Lax (SameSite=None requires
// Secure which requires HTTPS).
// ====================================================================

export interface SessionCookieOptions {
  httpOnly: true;
  path: '/';
  maxAge: number;
  sameSite: 'none' | 'lax';
  secure?: boolean;
}

/**
 * Detect whether the request was served over HTTPS.
 * Checks X-Forwarded-Proto (set by the gateway / reverse proxy) first,
 * then falls back to the request URL protocol.
 */
export function isHttpsRequest(request: NextRequest): boolean {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto.includes('https');
  }
  return request.nextUrl.protocol === 'https:';
}

/**
 * Get cookie options for SETTING a session cookie (maxAge = 24h).
 */
export function getSessionCookieOptions(request: NextRequest): SessionCookieOptions {
  if (isHttpsRequest(request)) {
    return {
      httpOnly: true,
      path: '/',
      maxAge: TOKEN_EXPIRY_SECONDS,
      sameSite: 'none',
      secure: true,
    };
  }
  return {
    httpOnly: true,
    path: '/',
    maxAge: TOKEN_EXPIRY_SECONDS,
    sameSite: 'lax',
  };
}

/**
 * Get cookie options for CLEARING a session cookie (maxAge = 0).
 * The sameSite/secure attributes must match the original cookie or the
 * browser won't delete it.
 */
export function getClearCookieOptions(request: NextRequest): SessionCookieOptions {
  if (isHttpsRequest(request)) {
    return {
      httpOnly: true,
      path: '/',
      maxAge: 0,
      sameSite: 'none',
      secure: true,
    };
  }
  return {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
  };
}
