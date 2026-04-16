import { expect, test, vi } from "vitest";
import { FuelFinderClient } from "../dist";

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

const generatedToken = (accessToken: string, refreshToken: string) => ({
  success: true,
  data: {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: refreshToken,
  },
  message: "Operation successful",
});

const revokedTokenError = {
  success: false,
  data: {
    error: "Unauthorized",
    message: "Token revoked or expired",
  },
  message: "Unauthorized",
  error: {
    code: 403,
    details: "Unauthorized",
  },
};

test("retries a fuel-prices request until a later fresh token succeeds", async () => {
  const fetchMock = vi.fn();
  fetchMock.mockResolvedValueOnce(jsonResponse(200, generatedToken("token-1", "refresh-1")));
  fetchMock.mockResolvedValueOnce(jsonResponse(403, revokedTokenError));
  fetchMock.mockResolvedValueOnce(jsonResponse(200, generatedToken("token-2", "refresh-2")));
  fetchMock.mockResolvedValueOnce(jsonResponse(403, revokedTokenError));
  fetchMock.mockResolvedValueOnce(jsonResponse(200, generatedToken("token-3", "refresh-3")));
  fetchMock.mockResolvedValueOnce(jsonResponse(200, []));

  const client = new FuelFinderClient({
    clientId: "client-id",
    clientSecret: "client-secret",
    fetch: fetchMock as unknown as typeof globalThis.fetch,
  });

  await expect(client.getIncrementalPFSFuelPrices("2099-01-01")).resolves.toEqual([]);
  expect(fetchMock).toHaveBeenCalledTimes(6);
});

test("retries transient auth transport failures before fetching fuel prices", async () => {
  const fetchMock = vi.fn();
  fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
  fetchMock.mockResolvedValueOnce(jsonResponse(200, generatedToken("token-1", "refresh-1")));
  fetchMock.mockResolvedValueOnce(jsonResponse(200, []));

  const client = new FuelFinderClient({
    clientId: "client-id",
    clientSecret: "client-secret",
    fetch: fetchMock as unknown as typeof globalThis.fetch,
  });

  await expect(client.getIncrementalPFSFuelPrices("2099-01-01")).resolves.toEqual([]);
  expect(fetchMock).toHaveBeenCalledTimes(3);
});
