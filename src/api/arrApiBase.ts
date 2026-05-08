import type {
  ArrAppWithKey,
  QualityProfile,
  RootFolder,
  SystemStatus,
} from "./types";

export abstract class ArrApiBase {
  protected app: ArrAppWithKey;
  private readonly REQUEST_TIMEOUT = 5000; // 5 seconds

  constructor(app: ArrAppWithKey) {
    this.app = app;
  }

  protected async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.app.url}/api/v3${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.REQUEST_TIMEOUT,
    );

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "X-Api-Key": this.app.apiKey,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (response.status === 401) {
        throw new Error("Invalid API key.");
      }

      if (!response.ok) {
        let message = "Unable to connect. Check your URL.";
        try {
          const body = await response.json();
          if (Array.isArray(body) && body.length > 0) {
            const first = body[0] as {
              errorCode?: unknown;
              errorMessage?: unknown;
            };
            const code =
              typeof first?.errorCode === "string" ? first.errorCode : "";
            const errorMessage =
              typeof first?.errorMessage === "string" ? first.errorMessage : "";
            if (
              code.includes("ExistsValidator") ||
              /already been added/i.test(errorMessage)
            ) {
              message = "Already exists.";
            } else if (errorMessage) {
              message = errorMessage;
            }
          } else if (body && typeof body === "object") {
            const fallbackMessage = (body as { message?: unknown }).message;
            if (typeof fallbackMessage === "string" && fallbackMessage.trim()) {
              message = fallbackMessage;
            }
          }
        } catch {
          // Fall back to default error message.
        }
        throw new Error(message);
      }

      try {
        return await response.json();
      } catch {
        throw new Error(`${this.app.type} returned invalid JSON.`);
      }
    } catch (err) {
      if (err instanceof TypeError) {
        throw new Error("Unable to connect. Check your URL.");
      }
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error("Server timed out.");
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
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
