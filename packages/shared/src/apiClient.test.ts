import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, createApiClient, isTimeoutError } from './apiClient';

const abortError = (): Error => {
  const error = new Error('The operation was aborted');
  error.name = 'AbortError';
  return error;
};

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

/**
 * A fetch that never answers until it is told to stop.
 *
 * Mirrors the platform: `fetch` rejects straight away when handed a signal that
 * is already aborted, rather than waiting for an event that has come and gone.
 */
const hangingFetch = (): ReturnType<typeof vi.fn> =>
  vi.fn((_url: string, init?: RequestInit) => {
    const signal = init?.signal;
    return new Promise<Response>((_resolve, reject) => {
      if (signal?.aborted) {
        reject(abortError());
        return;
      }
      signal?.addEventListener('abort', () => reject(abortError()));
    });
  });

const urlOf = (fetchMock: ReturnType<typeof vi.fn>, call = 0): string =>
  String(fetchMock.mock.calls[call]?.[0]);

/** A JSON `fetch` whose call arguments stay typed, for asserting on the init. */
const jsonFetch = (body: unknown = {}): ReturnType<typeof vi.fn> =>
  vi.fn(async (_url: string, _init?: RequestInit) => jsonResponse(body));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('createApiClient', () => {
  describe('URL building', () => {
    it('drops a trailing slash from the base URL', async () => {
      const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
      vi.stubGlobal('fetch', fetchMock);

      const client = createApiClient({ baseUrl: 'http://example.test/' });
      await client.get('/v1/feed');

      expect(urlOf(fetchMock)).toBe('http://example.test/v1/feed');
    });

    it('adds the leading slash the caller may have omitted', async () => {
      const fetchMock = vi.fn(async () => jsonResponse({}));
      vi.stubGlobal('fetch', fetchMock);

      await createApiClient({ baseUrl: 'http://example.test' }).get('v1/feed');

      expect(urlOf(fetchMock)).toBe('http://example.test/v1/feed');
    });

    it('encodes query values and skips empty ones', async () => {
      const fetchMock = vi.fn(async () => jsonResponse({}));
      vi.stubGlobal('fetch', fetchMock);

      await createApiClient({ baseUrl: 'http://example.test' }).get('/v1/feed', {
        query: {
          topic: 'court',
          limit: 20,
          includePodcasts: undefined,
          cursor: null,
          search: '',
          spaced: 'a b & c',
        },
      });

      const url = urlOf(fetchMock);
      expect(url).toContain('topic=court');
      expect(url).toContain('limit=20');
      expect(url).toContain('spaced=a%20b%20%26%20c');
      // Empty values would make the API parse `cursor=` and reject it.
      expect(url).not.toContain('includePodcasts');
      expect(url).not.toContain('cursor');
      expect(url).not.toContain('search=');
    });

    it('omits the query string entirely when nothing is set', async () => {
      const fetchMock = vi.fn(async () => jsonResponse({}));
      vi.stubGlobal('fetch', fetchMock);

      await createApiClient({ baseUrl: 'http://example.test' }).get('/v1/sources');

      expect(urlOf(fetchMock)).toBe('http://example.test/v1/sources');
    });
  });

  describe('auth', () => {
    it('sends a bearer token when the caller supplies one', async () => {
      const fetchMock = jsonFetch();
      vi.stubGlobal('fetch', fetchMock);

      await createApiClient({
        baseUrl: 'http://example.test',
        getToken: async () => 'token-123',
      }).get('/v1/feed');

      const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
      expect(init.headers).toMatchObject({ authorization: 'Bearer token-123' });
    });

    it('sends no authorization header when signed out', async () => {
      const fetchMock = jsonFetch();
      vi.stubGlobal('fetch', fetchMock);

      await createApiClient({
        baseUrl: 'http://example.test',
        getToken: async () => null,
      }).get('/v1/feed');

      const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
      expect(init.headers).not.toHaveProperty('authorization');
    });
  });

  describe('responses', () => {
    it('returns the parsed body', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ items: [] })));

      const result = await createApiClient({
        baseUrl: 'http://example.test',
      }).get<{ items: unknown[] }>('/v1/feed');

      expect(result).toEqual({ items: [] });
    });

    it('returns null for an empty body rather than throwing', async () => {
      // A 204 carries no body, and the platform rejects a Response that has one.
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(null, { status: 204 }))
      );

      const result = await createApiClient({
        baseUrl: 'http://example.test',
      }).get('/v1/feed');

      expect(result).toBeNull();
    });

    it('raises ApiError carrying the server message', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () =>
          jsonResponse({ error: 'not_found', message: 'No item with that id' }, 404)
        )
      );

      const client = createApiClient({ baseUrl: 'http://example.test' });

      await expect(client.get('/v1/items/1')).rejects.toThrowError(
        'No item with that id'
      );
    });

    it('falls back to the error code when the body has no message', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => jsonResponse({ error: 'invalid_request' }, 400))
      );

      const client = createApiClient({ baseUrl: 'http://example.test' });

      await expect(client.get('/v1/feed')).rejects.toThrowError('invalid_request');
    });

    it('still sets a status when the error body is not JSON', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response('<html>502</html>', { status: 502 }))
      );

      const client = createApiClient({ baseUrl: 'http://example.test' });

      await expect(client.get('/v1/feed')).rejects.toMatchObject({
        status: 502,
        body: null,
      });
    });

    it('does not retry a POST, which is not idempotent', async () => {
      const fetchMock = vi.fn(async () => {
        throw new TypeError('Network request failed');
      });
      vi.stubGlobal('fetch', fetchMock);

      const client = createApiClient({ baseUrl: 'http://example.test' });

      await expect(client.post('/v1/feed', {})).rejects.toThrowError(
        'Network request failed'
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('retries a GET once after a network failure', async () => {
      const fetchMock = vi
        .fn()
        .mockRejectedValueOnce(new TypeError('Network request failed'))
        .mockResolvedValueOnce(jsonResponse({ ok: true }));
      vi.stubGlobal('fetch', fetchMock);

      const client = createApiClient({ baseUrl: 'http://example.test' });

      await expect(client.get('/v1/feed')).resolves.toEqual({ ok: true });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('does not retry when retries are switched off', async () => {
      const fetchMock = vi.fn(async () => {
        throw new TypeError('Network request failed');
      });
      vi.stubGlobal('fetch', fetchMock);

      const client = createApiClient({
        baseUrl: 'http://example.test',
        retryOnNetworkError: false,
      });

      await expect(client.get('/v1/feed')).rejects.toThrowError('Network request failed');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('timeout', () => {
    it('reports a stall as a 408 timeout, not a bare abort', async () => {
      vi.stubGlobal('fetch', hangingFetch());

      const client = createApiClient({
        baseUrl: 'http://example.test',
        timeoutMs: 20,
      });

      await expect(client.get('/v1/feed')).rejects.toMatchObject({
        status: 408,
        message: 'The request timed out',
      });
    });

    it('exposes isTimeoutError so a caller can tell a stall from a failure', async () => {
      vi.stubGlobal('fetch', hangingFetch());

      const client = createApiClient({
        baseUrl: 'http://example.test',
        timeoutMs: 20,
      });

      const error = await client.get('/v1/feed').catch((caught: unknown) => caught);

      expect(isTimeoutError(error)).toBe(true);
      expect(isTimeoutError(new ApiError(500, null))).toBe(false);
      expect(isTimeoutError(new Error('nope'))).toBe(false);
    });

    it('does not retry a timeout, because the caller already waited', async () => {
      const fetchMock = hangingFetch();
      vi.stubGlobal('fetch', fetchMock);

      const client = createApiClient({
        baseUrl: 'http://example.test',
        timeoutMs: 20,
      });

      await expect(client.get('/v1/feed')).rejects.toMatchObject({ status: 408 });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('caller cancellation', () => {
    it('propagates an abort and does not retry it', async () => {
      const fetchMock = hangingFetch();
      vi.stubGlobal('fetch', fetchMock);

      const controller = new AbortController();
      const client = createApiClient({ baseUrl: 'http://example.test' });
      const pending = client.get('/v1/feed', { signal: controller.signal });

      controller.abort();

      await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('aborts immediately when the signal is already aborted', async () => {
      const fetchMock = hangingFetch();
      vi.stubGlobal('fetch', fetchMock);

      const controller = new AbortController();
      controller.abort();

      const client = createApiClient({ baseUrl: 'http://example.test' });

      await expect(
        client.get('/v1/feed', { signal: controller.signal })
      ).rejects.toMatchObject({ name: 'AbortError' });
    });
  });
});
