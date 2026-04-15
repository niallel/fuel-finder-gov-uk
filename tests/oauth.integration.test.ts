import { test, expect, describe } from "vitest";
import { FuelFinderAuthClient, FuelFinderApiError } from "../dist";

const clientId = process.env.FUEL_FINDER_CLIENT_ID as string;
const clientSecret = process.env.FUEL_FINDER_CLIENT_SECRET as string;
const runNegativeLiveTests = process.env.FUEL_FINDER_ENABLE_NEGATIVE_LIVE_TESTS === "1";
const negativeLiveTest = runNegativeLiveTests ? test : test.skip;

describe.sequential("oauth token lifecycle against live API", () => {
  const client = new FuelFinderAuthClient();

  test("generate and refresh access token", async () => {
    const tokens = await client.generateAccessToken({
      clientId,
      clientSecret,
    });
    expect(tokens.access_token).toBeTruthy();
    expect(tokens.token_type).toBe("Bearer");
    expect(tokens.expires_in).toBeGreaterThan(0);
    expect(tokens.refresh_token).toBeTruthy();

    const refreshed = await client.regenerateAccessToken({
      clientId,
      refreshToken: tokens.refresh_token,
    });
    expect(refreshed.access_token).toBeTruthy();
    expect(refreshed.token_type).toBe("Bearer");
    expect(refreshed.expires_in).toBeGreaterThan(0);
  });
});

negativeLiveTest("rejects invalid client credentials", async () => {
  const badClient = new FuelFinderAuthClient();
  await expect(
    badClient.generateAccessToken({
      clientId: clientId + "-invalid",
      clientSecret: "wrong-secret",
    }),
  ).rejects.toBeInstanceOf(FuelFinderApiError);
});
