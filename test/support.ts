/**
 * Shared test support: response builders and a fixture router.
 *
 * Lives outside the *.test.ts glob so importing it never registers another
 * file's tests.
 */
type JsonInit = { status?: number; headers?: Record<string, string> };

export function jsonResponse(body: unknown, init: JsonInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      'content-type': 'application/json',
      'x-github-request-id': 'req-fixture-1',
      'x-ratelimit-remaining': '4999',
      'x-ratelimit-reset': '1763000000',
      ...(init.headers ?? {}),
    },
  });
}

/** Routes requests by path+query so no network call is ever made. */
export function routedFetch(
  routes: Record<string, () => Response>,
  counter: { calls: number },
): typeof fetch {
  const impl = async (input: Request | string | URL): Promise<Response> => {
    counter.calls += 1;
    const raw =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const url = new URL(raw);
    const handler = routes[`${url.pathname}${url.search}`] ?? routes[url.pathname];
    return handler ? handler() : jsonResponse({ message: 'Not Found' }, { status: 404 });
  };
  return impl as typeof fetch;
}
