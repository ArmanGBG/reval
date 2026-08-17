const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function requestOrigin(request: Request): string {
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  if (forwardedProto && forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return new URL(request.url).origin;
}

export function isTrustedMutationOrigin(request: Request, configuredOrigins = process.env.CSRF_ALLOWED_ORIGINS || ''): boolean {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return true;
  const origin = request.headers.get('origin');
  if (!origin) return false;
  const allowed = new Set([
    requestOrigin(request),
    ...configuredOrigins.split(',').map((value) => value.trim()).filter(Boolean),
  ]);
  return allowed.has(origin);
}
