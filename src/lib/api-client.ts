// ====================================================================
// Global API client — wraps fetch with automatic 401 handling.
//
// Problem this solves:
//   When a user's session cookie expires (24h maxAge) while the app is
//   open, every subsequent /api/* call returns 401 "احراز هویت لازم است".
//   Without a global handler, each call site shows its own scary error
//   toast and the user is stuck on a broken dashboard.
//
// Solution:
//   `apiFetch()` wraps the native fetch. When a response is 401, it
//   triggers a single global callback (registered by the app shell) that
//   gracefully logs the user out and sends them to the login page —
//   instead of scattering error toasts everywhere.
//
//   Non-401 responses are returned as-is so callers handle their own
//   errors (400, 403, 500, etc.) as before.
// ====================================================================

type UnauthHandler = () => void;

let unauthHandler: UnauthHandler | null = null;
let unauthTriggered = false; // de-dupe: only trigger once until reset

/**
 * Register the global 401 handler. Called once by the app shell on mount.
 * The handler should clear auth state + redirect to login.
 */
export function registerUnauthHandler(handler: UnauthHandler) {
  unauthHandler = handler;
  unauthTriggered = false;
}

/**
 * Reset the de-dupe flag (e.g. after the user logs back in).
 */
export function resetUnauthState() {
  unauthTriggered = false;
}

/**
 * Global fetch wrapper for /api/* calls.
 *
 * - Sends credentials (cookies) by default (same-origin).
 * - On HTTP 401, fires the registered unauth handler ONCE and throws an
 *   `AuthError` so the calling code's catch block doesn't show a duplicate
 *   scary toast.
 * - All other responses (including errors like 400/403/500) are returned
 *   untouched so existing error-handling logic keeps working.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, {
    credentials: 'same-origin',
    ...init,
  });

  if (res.status === 401) {
    if (!unauthTriggered) {
      unauthTriggered = true;
      try {
        unauthHandler?.();
      } catch {
        // handler error — don't block the throw below
      }
    }
    throw new AuthError('نشست شما منقضی شده است. در حال انتقال به صفحه ورود…');
  }

  return res;
}

/**
 * Custom error class for 401 responses.
 * Callers can check `err instanceof AuthError` to suppress duplicate toasts.
 */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Helper: parse JSON error from a response, falling back to a default.
 */
export async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data.error || fallback;
  } catch {
    return fallback;
  }
}
