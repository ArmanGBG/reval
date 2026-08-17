import { describe, expect, it } from 'vitest';
import { isTrustedMutationOrigin } from '@/lib/request-origin';

function request(method: string, origin?: string, url = 'https://app.reval.ir/api/users') {
  return new Request(url, {
    method,
    headers: origin ? { origin } : undefined,
  });
}

describe('mutation request origin protection', () => {
  it('allows same-origin mutations and safe methods', () => {
    expect(isTrustedMutationOrigin(request('POST', 'https://app.reval.ir'))).toBe(true);
    expect(isTrustedMutationOrigin(request('PATCH', 'https://app.reval.ir'))).toBe(true);
    expect(isTrustedMutationOrigin(request('GET'))).toBe(true);
    expect(isTrustedMutationOrigin(request('OPTIONS'))).toBe(true);
  });

  it('rejects cross-site and missing-origin mutations', () => {
    expect(isTrustedMutationOrigin(request('POST', 'https://evil.example'))).toBe(false);
    expect(isTrustedMutationOrigin(request('DELETE'))).toBe(false);
  });

  it('allows explicitly configured preview origins', () => {
    expect(isTrustedMutationOrigin(request('POST', 'https://preview.example'), 'https://preview.example')).toBe(true);
  });

  it('uses forwarded origin in proxied deployments', () => {
    const proxied = new Request('http://internal:3000/api/users', {
      method: 'POST',
      headers: {
        origin: 'https://preview.example',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'preview.example',
      },
    });
    expect(isTrustedMutationOrigin(proxied)).toBe(true);
  });
});
