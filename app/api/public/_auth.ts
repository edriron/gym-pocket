/**
 * Auth check for public API endpoints.
 *
 * If ALLOW_ENDPOINTS env var exists and equals "true", every request must
 * supply a key that matches ENDPOINT_SECRET_KEY — either via:
 *   - Header:  x-api-key: <key>
 *   - Header:  Authorization: Bearer <key>
 *   - Query:   ?key=<key>
 *
 * If ALLOW_ENDPOINTS is absent or not "true", all requests are allowed
 * with no auth required.
 */
export function checkPublicApiAuth(request: Request): { ok: true } | { ok: false; status: number; error: string } {
  const allowEndpoints = process.env.ALLOW_ENDPOINTS

  if (!allowEndpoints || allowEndpoints !== 'true') {
    return { ok: true }
  }

  const secret = process.env.ENDPOINT_SECRET_KEY
  if (!secret) {
    return { ok: false, status: 500, error: 'ENDPOINT_SECRET_KEY is not configured on the server' }
  }

  const url = new URL(request.url)
  const key =
    request.headers.get('x-api-key') ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    url.searchParams.get('key')

  if (key !== secret) {
    return { ok: false, status: 401, error: 'Unauthorized: invalid or missing API key' }
  }

  return { ok: true }
}
