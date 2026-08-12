// Auth utilities for Node.js runtime (API routes)
import crypto from 'crypto';
import type { NextRequest } from 'next/server';

// Secret key for HMAC signing — derive from env or use a dev default
const AUTH_SECRET = process.env.AUTH_SECRET || 'reval-dev-secret-change-in-production';

if (process.env.NODE_ENV === 'production' && !process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET is required in production');
}

// Session lifetime is configurable in production. Accounts themselves are
// permanent DB records; only the signed browser session expires. Keep users
// signed in for one year by default, while allowing Liara to override it with
// AUTH_SESSION_DAYS (accepted range: 1..3650 days).
const DEFAULT_SESSION_DAYS = 365;
const configuredSessionDays = Number.parseInt(process.env.AUTH_SESSION_DAYS || '', 10);
const SESSION_DAYS = Number.isFinite(configuredSessionDays)
  ? Math.min(3650, Math.max(1, configuredSessionDays))
  : DEFAULT_SESSION_DAYS;
const TOKEN_EXPIRY_SECONDS = SESSION_DAYS * 24 * 60 * 60;

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
// Session cookie options — cross-site iframe compatible (bulletproof)
// --------------------------------------------------------------------
// The app is rendered inside a cross-site iframe in the preview panel
// (and any deployed context). Browsers do NOT send SameSite=Lax cookies
// on cross-site subrequests (e.g. fetch from within the iframe), so
// every /api/* call after login would return 401 → SessionGuard fires
// "نشست شما منقضی شده" → auto-logout.
//
// Strategy (default-secure):
//   Use SameSite=None; Secure for ALL requests EXCEPT direct local HTTP
//   development access (localhost / 127.0.0.1 over plain HTTP). Secure
//   cookies are only stored/sent over HTTPS, so we cannot use them on
//   plain HTTP localhost — there we fall back to SameSite=Lax.
//
//   This means any preview/deployed/gateway context (regardless of the
//   exact host name) gets the cross-site-compatible cookie, which fixes
//   the "kicked out after login" issue robustly.
// ====================================================================

export interface SessionCookieOptions {
  httpOnly: true;
  path: '/';
  maxAge: number;
  sameSite: 'none' | 'lax';
  secure?: boolean;
}

/**
 * Detect whether the request is a DIRECT local HTTP development access
 * (the only context where SameSite=None; Secure would NOT work, because
 * Secure cookies require HTTPS).
 *
 * Returns true ONLY for plain-HTTP requests to localhost / 127.0.0.1
 * with no forwarding headers (i.e. truly direct local dev, not proxied).
 */
export function isDirectLocalHttpAccess(request: NextRequest): boolean {
  // If any forwarding header is present, this is a proxied/deployed
  // request, not direct local access.
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedHost || forwardedProto || forwardedFor) {
    // Still allow localhost hosts through the proxy (e.g. localhost:81
    // gateway used for local testing) to use Lax if the connection is
    // plain HTTP and the host is localhost.
    const host = (forwardedHost || request.headers.get('host') || '').toLowerCase();
    const proto = (forwardedProto || request.nextUrl.protocol.replace(':', '') || 'http').toLowerCase();
    return proto === 'http' && (host.startsWith('localhost') || host.startsWith('127.0.0.1'));
  }

  // No forwarding headers — direct access. Check protocol + host.
  const host = (request.headers.get('host') || '').toLowerCase();
  const isHttp = request.nextUrl.protocol === 'http:';
  return isHttp && (host.startsWith('localhost') || host.startsWith('127.0.0.1'));
}

/**
 * Detect whether the request should use cross-site-compatible cookies
 * (SameSite=None; Secure). Kept for backward compatibility.
 */
export function isCrossSiteHttpsRequest(request: NextRequest): boolean {
  return !isDirectLocalHttpAccess(request);
}

/**
 * Get cookie options for SETTING a session cookie (maxAge = 24h).
 *
 * Default-secure: SameSite=None; Secure everywhere except direct local
 * HTTP dev access.
 */
export function getSessionCookieOptions(request: NextRequest): SessionCookieOptions {
  if (isDirectLocalHttpAccess(request)) {
    return {
      httpOnly: true,
      path: '/',
      maxAge: TOKEN_EXPIRY_SECONDS,
      sameSite: 'lax',
    };
  }
  return {
    httpOnly: true,
    path: '/',
    maxAge: TOKEN_EXPIRY_SECONDS,
    sameSite: 'none',
    secure: true,
  };
}

/**
 * Get cookie options for CLEARING a session cookie (maxAge = 0).
 * The sameSite/secure attributes must match the original cookie or the
 * browser won't delete it.
 */
export function getClearCookieOptions(request: NextRequest): SessionCookieOptions {
  if (isDirectLocalHttpAccess(request)) {
    return {
      httpOnly: true,
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
    };
  }
  return {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    sameSite: 'none',
    secure: true,
  };
}
