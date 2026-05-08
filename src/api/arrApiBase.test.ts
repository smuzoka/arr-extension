import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import ArrApiBase from "./arrApiBase";
import type { ArrAppWithKey } from "./types";

class TestApi extends ArrApiBase {
  public requestPublic(endpoint: string, options?: RequestInit) {
    return this.request(endpoint, options);
  }
}

const makeApp = (): ArrAppWithKey => ({
  id: "1",
  name: "Test Sonarr",
  type: "sonarr",
  url: "http://localhost:8989",
  apiKey: "abc12345",
  icon: "",
});

describe("ArrApiBase", () => {
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
        signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    }) as unknown as typeof fetch;

    const api = new TestApi(app);
    const promise = api.requestPublic("/system/status");

    vi.advanceTimersByTime(5000);

    await expect(promise).rejects.toThrow("Server timed out.");
  });

  it('throws "Invalid API key." on 401 response', async () => {
    const app = makeApp();

    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 401,
      json: vi.fn(),
    })) as unknown as typeof fetch;

    const api = new TestApi(app);
    await expect(api.requestPublic("/system/status")).rejects.toThrow(
      "Invalid API key.",
    );
  });

  it('throws "Already exists." when API reports a duplicate item', async () => {
    const app = makeApp();

    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 400,
      json: async () => [
        {
          errorCode: "SeriesExistsValidator",
          errorMessage: "This series has already been added",
        },
      ],
    })) as unknown as typeof fetch;

    const api = new TestApi(app);
    await expect(api.requestPublic("/series")).rejects.toThrow(
      "Already exists.",
    );
  });

  it('throws "Unable to connect. Check your URL." on network error', async () => {
    const app = makeApp();

    globalThis.fetch = vi.fn(async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;

    const api = new TestApi(app);
    await expect(api.requestPublic("/system/status")).rejects.toThrow(
      "Unable to connect. Check your URL.",
    );
  });

  it("clears timeout after successful request", async () => {
    const app = makeApp();
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ version: "4.0" }),
    })) as unknown as typeof fetch;

    const api = new TestApi(app);
    const result = await api.requestPublic("/system/status");

    expect(result).toEqual({ version: "4.0" });
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("clears timeout even after failed request", async () => {
    const app = makeApp();
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: vi.fn(),
    })) as unknown as typeof fetch;

    const api = new TestApi(app);
    await expect(api.requestPublic("/system/status")).rejects.toThrow();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
