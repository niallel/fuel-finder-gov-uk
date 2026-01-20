import { FuelFinderApiError } from "./errors";
import {
  AccessTokenData,
  ErrorResponse,
  FuelFinderAuthClientOptions,
  FuelFinderClientOptions,
  GenerateAccessTokenRequest,
  GenerateAccessTokenResponse,
  RefreshAccessTokenData,
  RegenerateAccessTokenRequest,
  RegenerateAccessTokenResponse,
  PFSFuelPricesResponse,
  PFSInfoResponse,
} from "./types";

const DEFAULT_BASE_URL = "https://www.register-fuel-finder-scheme.service.gov.uk";

interface TokenCache {
  accessToken: string;
  tokenType: string;
  refreshToken?: string;
  expiresAt: number;
  expiresIn: number;
}

export class FuelFinderAuthClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof globalThis.fetch;
  private readonly timeoutMs?: number;

  /**
   * Create an OAuth-only client for generating and refreshing access tokens.
   * @param options Configuration options for base URL, fetch implementation, and timeout.
   */
  constructor(options: FuelFinderAuthClientOptions = {}) {
    this.baseUrl = options.baseUrl?.replace(/\/$/, "") ?? DEFAULT_BASE_URL;
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs;

    if (!this.fetchImpl) {
      throw new Error("A fetch implementation is required (Node 18+ provides a global fetch).");
    }
  }

  /**
   * Exchange client credentials for an access token.
   * @param payload Client credentials to send to the OAuth endpoint.
   * @returns Access token payload from the API.
   */
  async generateAccessToken(
    payload: GenerateAccessTokenRequest,
  ): Promise<AccessTokenData> {
    // OAuth endpoint expects snake_case field names.
    const response = await this.post<GenerateAccessTokenResponse>(
      "/api/v1/oauth/generate_access_token",
      {
        client_id: payload.clientId,
        client_secret: payload.clientSecret,
      },
    );

    if (!response.success || !response.data) {
      throw new FuelFinderApiError(
        "Access token response was missing expected fields.",
        500,
        response,
      );
    }

    return response.data;
  }

  /**
   * Use a refresh token to obtain a new access token.
   * @param payload Client ID and refresh token.
   * @returns Refreshed access token payload.
   */
  async regenerateAccessToken(
    payload: RegenerateAccessTokenRequest,
  ): Promise<RefreshAccessTokenData> {
    // Refresh responses can be either wrapped or unwrapped depending on API behavior.
    const response = await this.post<RegenerateAccessTokenResponse>(
      "/api/v1/oauth/regenerate_access_token",
      {
        client_id: payload.clientId,
        refresh_token: payload.refreshToken,
      },
    );

    if ("success" in response) {
      if (!response.success || !response.data) {
        throw new FuelFinderApiError(
          "Refresh response was missing expected fields.",
          500,
          response,
        );
      }

      return response.data;
    }

    if (!response.access_token) {
      throw new FuelFinderApiError(
        "Refresh response was missing expected fields.",
        500,
        response,
      );
    }

    return response;
  }

  /**
   * POST a JSON payload and parse the response.
   * @param path API path to call.
   * @param body JSON payload to send.
   * @returns Parsed response body.
   */
  private async post<T>(
    path: string,
    body: Record<string, string>,
  ): Promise<T> {
    const controller = this.timeoutMs ? new AbortController() : undefined;
    const timeout = this.timeoutMs
      ? setTimeout(() => controller?.abort(), this.timeoutMs)
      : undefined;

    try {
      // Build the full URL once to keep error messages consistent.
      const url = new URL(path, this.baseUrl).toString();
      const response = await this.fetchImpl(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller?.signal,
      });

      const text = await response.text();
      const parsed = text ? (JSON.parse(text) as T | ErrorResponse) : {};

      if (!response.ok) {
        throw new FuelFinderApiError(
          `Fuel Finder API returned status ${response.status}.`,
          response.status,
          parsed,
        );
      }

      return parsed as T;
    } catch (error) {
      if (error instanceof FuelFinderApiError) {
        throw error;
      }

      if ((error as Error).name === "AbortError") {
        throw new FuelFinderApiError(
          `Request timed out after ${this.timeoutMs}ms.`,
          408,
        );
      }

      throw new FuelFinderApiError(
        "Failed to call the Fuel Finder API.",
        0,
        error,
      );
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }
}

export class FuelFinderClient {
  private readonly authClient: FuelFinderAuthClient;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof globalThis.fetch;
  private readonly timeoutMs?: number;
  private tokenCache?: TokenCache;

  /**
   * Create a client that manages OAuth tokens and calls PFS endpoints.
   * @param options Client configuration, including OAuth credentials.
   */
  constructor(options: FuelFinderClientOptions) {
    const { clientId, clientSecret, ...rest } = options;
    if (!clientId || !clientSecret) {
      throw new Error("clientId and clientSecret are required.");
    }

    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = rest.baseUrl?.replace(/\/$/, "") ?? DEFAULT_BASE_URL;
    this.fetchImpl = rest.fetch ?? globalThis.fetch;
    this.timeoutMs = rest.timeoutMs;

    if (!this.fetchImpl) {
      throw new Error("A fetch implementation is required (Node 18+ provides a global fetch).");
    }

    this.authClient = new FuelFinderAuthClient({
      baseUrl: this.baseUrl,
      fetch: this.fetchImpl,
      timeoutMs: this.timeoutMs,
    });
  }

  /**
   * Fetch all fuel prices from the PFS endpoint.
   * @returns Fuel prices wrapped in the standard API envelope.
   */
  async getAllPFSFuelPrices(): Promise<PFSFuelPricesResponse> {
    return this.authenticatedGet<PFSFuelPricesResponse>("/api/v1/pfs/fuel-prices");
  }

  /**
   * Fetch fuel prices updated since the provided date/time.
   * @param dateTime Date or timestamp string used by the API for incremental updates.
   * @returns Fuel prices wrapped in the standard API envelope.
   */
  async getIncrementalPFSFuelPrices(dateTime: string): Promise<PFSFuelPricesResponse> {
    return this.authenticatedGet<PFSFuelPricesResponse>("/api/v1/pfs/fuel-prices", {
      date_time: dateTime,
    });
  }

  /**
   * Fetch station metadata from the PFS info endpoint.
   * @returns Station metadata wrapped in the standard API envelope.
   */
  async getPFSInfo(): Promise<PFSInfoResponse> {
    return this.authenticatedGet<PFSInfoResponse>("/api/v1/pfs/");
  }

  /**
   * Fetch station metadata updated since the provided date/time.
   * @param dateTime Date or timestamp string used by the API for incremental updates.
   * @returns Station metadata wrapped in the standard API envelope.
   */
  async getIncrementalPFSInfo(dateTime: string): Promise<PFSInfoResponse> {
    return this.authenticatedGet<PFSInfoResponse>("/api/v1/pfs", { date_time: dateTime });
  }

  /**
   * Ensure an access token is available and valid, refreshing or generating as needed.
   * @returns The current access token string.
   */
  async getAccessToken(): Promise<string> {
    await this.ensureAccessToken();
    return this.tokenCache!.accessToken;
  }

  /**
   * Ensure the access token cache is populated and not expired.
   * @returns Resolves once the token cache is valid.
   */
  private async ensureAccessToken(): Promise<void> {
    const now = Date.now();
    // Return early if the cached token is still valid.
    if (this.tokenCache && this.tokenCache.expiresAt > now) {
      return;
    }

    // Try refresh if we have a refresh token cached
    if (this.tokenCache?.refreshToken) {
      try {
        const refreshed = await this.authClient.regenerateAccessToken({
          clientId: this.clientId,
          refreshToken: this.tokenCache.refreshToken,
        });
        this.updateCache({
          access_token: refreshed.access_token,
          token_type: refreshed.token_type,
          expires_in: refreshed.expires_in,
          refresh_token: this.tokenCache.refreshToken,
        });
        return;
      } catch (error) {
        // If refresh fails, fall back to generating a new token.
        this.tokenCache = undefined;
      }
    }

    const generated = await this.authClient.generateAccessToken({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    });
    this.updateCache(generated);
  }

  /**
   * Store token data with a computed expiry timestamp.
   * @param data Token payload to cache.
   */
  private updateCache(data: AccessTokenData): void {
    // Subtract a small buffer so we refresh before expiry.
    const expiresAt = Date.now() + data.expires_in * 1000 - 5000;
    this.tokenCache = {
      accessToken: data.access_token,
      tokenType: data.token_type,
      refreshToken: data.refresh_token,
      expiresAt,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Perform an authenticated GET request with optional query parameters.
   * @param path API path to call.
   * @param query Optional query string parameters.
   * @returns Parsed response body.
   */
  private async authenticatedGet<T>(path: string, query?: Record<string, string>): Promise<T> {
    await this.ensureAccessToken();

    const controller = this.timeoutMs ? new AbortController() : undefined;
    const timeout = this.timeoutMs
      ? setTimeout(() => controller?.abort(), this.timeoutMs)
      : undefined;

    try {
      const url = new URL(path, this.baseUrl);
      if (query) {
        Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
      }

      const response = await this.fetchImpl(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Use the managed access token in the Authorization header.
          Authorization: `${this.tokenCache!.tokenType} ${this.tokenCache!.accessToken}`,
        },
        signal: controller?.signal,
      });

      const text = await response.text();
      const parsed = text ? (JSON.parse(text) as T | ErrorResponse) : {};

      if (!response.ok) {
        throw new FuelFinderApiError(
          `Fuel Finder API returned status ${response.status}.`,
          response.status,
          parsed,
        );
      }

      return parsed as T;
    } catch (error) {
      if (error instanceof FuelFinderApiError) {
        throw error;
      }

      if ((error as Error).name === "AbortError") {
        throw new FuelFinderApiError(
          "Request timed out.",
          408,
        );
      }

      throw new FuelFinderApiError("Failed to call the Fuel Finder API.", 0, error);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }
}
