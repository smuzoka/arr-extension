import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createArrApi } from './arrApi';
import type { ArrAppWithKey } from './types';

const makeApp = (type: ArrAppWithKey['type'] = 'sonarr'): ArrAppWithKey => ({
  id: '1',
  name: 'Test App',
  type,
  url: 'http://localhost:8989',
  apiKey: 'abc12345',
  icon: '',
});

describe('createArrApi', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('throws "Server timed out." when request aborts', async () => {
    const app = makeApp();

    globalThis.fetch = vi.fn((_url, options) => {
      const { signal } = options as RequestInit;
      return new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    }) as unknown as typeof fetch;

    const api = createArrApi(app);
    const promise = api.testConnection();

    vi.advanceTimersByTime(5000);

    await expect(promise).rejects.toThrow('Server timed out.');
  });

  it('throws "Invalid API key." on 401 response', async () => {
    const app = makeApp();

    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 401,
      json: vi.fn(),
    })) as unknown as typeof fetch;

    await expect(createArrApi(app).testConnection()).rejects.toThrow(
      'Invalid API key.',
    );
  });

  it('throws "Already exists." when API reports a duplicate item', async () => {
    const app = makeApp();

    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 400,
      json: async () => [
        {
          errorCode: 'SeriesExistsValidator',
          errorMessage: 'This series has already been added',
        },
      ],
    })) as unknown as typeof fetch;

    const api = createArrApi(app);
    if (!('addSeries' in api)) {
      throw new Error('Expected Sonarr API');
    }

    await expect(
      api.addSeries({
        title: 'Show',
        qualityProfileId: 1,
        rootFolderPath: '/tv',
        tvdbId: 123,
        monitored: true,
        seasonFolder: true,
      }),
    ).rejects.toThrow('Already exists.');
  });

  it('throws "Unable to connect. Check your URL." on network error', async () => {
    const app = makeApp();

    globalThis.fetch = vi.fn(async () => {
      throw new TypeError('fetch failed');
    }) as unknown as typeof fetch;

    await expect(createArrApi(app).testConnection()).rejects.toThrow(
      'Unable to connect. Check your URL.',
    );
  });

  it('clears timeout after successful request', async () => {
    const app = makeApp();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ version: '4.0' }),
    })) as unknown as typeof fetch;

    const result = await createArrApi(app).testConnection();

    expect(result).toEqual({ version: '4.0' });
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('clears timeout even after failed request', async () => {
    const app = makeApp();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: vi.fn(),
    })) as unknown as typeof fetch;

    await expect(createArrApi(app).testConnection()).rejects.toThrow();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('returns typed search results for each app kind', async () => {
    globalThis.fetch = vi
      .fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [{ id: 1, title: 'Show', tvdbId: 7, images: [] }],
      }))
      .mockImplementationOnce(async () => ({
        ok: true,
        status: 200,
        json: async () => [{ id: 1, title: 'Show', tvdbId: 7, images: [] }],
      }))
      .mockImplementationOnce(async () => ({
        ok: true,
        status: 200,
        json: async () => [{ id: 2, title: 'Movie', tmdbId: 9, images: [] }],
      })) as unknown as typeof fetch;

    const sonarrApi = createArrApi(makeApp('sonarr'));
    const radarrApi = createArrApi(makeApp('radarr'));

    if (!('searchSeries' in sonarrApi) || !('searchMovies' in radarrApi)) {
      throw new Error('Expected app-specific methods');
    }

    await expect(sonarrApi.searchSeries('show')).resolves.toEqual([
      expect.objectContaining({ kind: 'series', tvdbId: 7 }),
    ]);
    await expect(radarrApi.searchMovies('movie')).resolves.toEqual([
      expect.objectContaining({ kind: 'movie', tmdbId: 9 }),
    ]);
  });
});
