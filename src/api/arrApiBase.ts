import type { ArrAppWithKey, QualityProfile, RootFolder, SystemStatus } from "./types";

export abstract class ArrApiBase {
  protected app: ArrAppWithKey;
  private readonly REQUEST_TIMEOUT = 5000; // 5 seconds

  constructor(app: ArrAppWithKey) {
    this.app = app;
  }

  protected async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.app.url}/api/v3${endpoint}`;
    const appContext = `${this.app.type}:${this.app.name}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.REQUEST_TIMEOUT,
      );

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "X-Api-Key": this.app.apiKey,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `${appContext} API error (${response.status}): ${response.statusText}`,
        );
      }

      try {
        return await response.json();
      } catch (err) {
        throw new Error(
          `${appContext} returned invalid response (${response.status}): Unable to parse JSON`,
        );
      }
    } catch (err) {
      if (err instanceof TypeError) {
        // Network error or fetch failure
        throw new Error(
          `${appContext} connection failed: Network error. Check server URL and permissions.`,
        );
      }
      if (err instanceof DOMException && err.name === "AbortError") {
        // Request timeout
        throw new Error(
          `${appContext} request timeout: Connection took longer than ${this.REQUEST_TIMEOUT / 1000} seconds`,
        );
      }
      // Re-throw our custom errors or other errors
      throw err;
    }
  }

  async testConnection(): Promise<SystemStatus> {
    return this.request("/system/status");
  }

  async getQualityProfiles(): Promise<QualityProfile[]> {
    return this.request("/qualityProfile");
  }

  async getRootFolders(): Promise<RootFolder[]> {
    return this.request("/rootfolder");
  }
}

export default ArrApiBase;
