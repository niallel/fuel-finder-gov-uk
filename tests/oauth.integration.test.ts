import { test, expect, describe } from "vitest";
import { FuelFinderAuthClient, FuelFinderApiError } from "../dist";

const clientId = process.env.FUEL_FINDER_CLIENT_ID as string;
const clientSecret = process.env.FUEL_FINDER_CLIENT_SECRET as string;

describe.sequential("oauth token lifecycle against live API", () => {
  const client = new FuelFinderAuthClient();
  let tokens: Awaited<ReturnType<FuelFinderAuthClient["generateAccessToken"]>>;
  let refreshed: Awaited<
    ReturnType<FuelFinderAuthClient["regenerateAccessToken"]>
  >;

  test("generate access token", async () => {
    tokens = await client.generateAccessToken({
      clientId,
      clientSecret,
    });
  });

  test("access token includes access_token", () => {
    expect(tokens.access_token).toBeTruthy();
  });

  test("access token includes token_type", () => {
    expect(tokens.token_type).toBe("Bearer");
  });

  test("access token includes expires_in", () => {
    expect(tokens.expires_in).toBeGreaterThan(0);
  });

  test("access token includes refresh_token", () => {
    expect(tokens.refresh_token).toBeTruthy();
  });

  test("refresh access token", async () => {
    refreshed = await client.regenerateAccessToken({
      clientId,
      refreshToken: tokens.refresh_token,
    });
  });

  test("refreshed token includes access_token", () => {
    expect(refreshed.access_token).toBeTruthy();
  });

  test("refreshed token includes token_type", () => {
    expect(refreshed.token_type).toBe("Bearer");
  });

  test("refreshed token includes expires_in", () => {
    expect(refreshed.expires_in).toBeGreaterThan(0);
  });
});

test("rejects invalid client credentials", async () => {
  const badClient = new FuelFinderAuthClient();
  await expect(
    badClient.generateAccessToken({
      clientId: clientId + "-invalid",
      clientSecret: "wrong-secret",
    }),
  ).rejects.toBeInstanceOf(FuelFinderApiError);
});
