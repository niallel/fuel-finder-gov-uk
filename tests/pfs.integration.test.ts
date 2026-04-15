import { test, expect, describe } from "vitest";
import { FuelFinderClient, FuelFinderApiError } from "../dist";

const FUTURE_EFFECTIVE_START = "2099-01-01";
const FUTURE_EFFECTIVE_START_DATE = new Date("2099-01-01T00:00:00Z");

const createClient = () => new FuelFinderClient({
  clientId: process.env.FUEL_FINDER_CLIENT_ID as string,
  clientSecret: process.env.FUEL_FINDER_CLIENT_SECRET as string,
});
const runNegativeLiveTests = process.env.FUEL_FINDER_ENABLE_NEGATIVE_LIVE_TESTS === "1";
const negativeLiveTest = runNegativeLiveTests ? test : test.skip;

const assertFuelPricesResponse = (res: unknown) => {
  expect(Array.isArray(res)).toBe(true);
  if (Array.isArray(res) && res.length > 0) {
    const station = res[0] as {
      node_id?: string;
      fuel_prices?: Array<{
        price?: unknown;
        fuel_type?: unknown;
        price_last_updated?: unknown;
        price_change_effective_timestamp?: unknown;
      }>;
    };
    expect(typeof station.node_id).toBe("string");
    expect(Array.isArray(station.fuel_prices)).toBe(true);
    if (station.fuel_prices && station.fuel_prices.length > 0) {
      const price = station.fuel_prices[0];
      expect(typeof price.fuel_type).toBe("string");
      expect(price.price === null || typeof price.price === "number").toBe(true);
      expect(
        price.price_last_updated === null || typeof price.price_last_updated === "string",
      ).toBe(true);
      expect(
        price.price_change_effective_timestamp === null
          || typeof price.price_change_effective_timestamp === "string",
      ).toBe(true);
    }
  }
};

const assertPfsInfoResponse = (res: unknown) => {
  expect(Array.isArray(res)).toBe(true);
  if (Array.isArray(res) && res.length > 0) {
    const station = res[0] as {
      node_id?: string;
      location?: {
        latitude?: unknown;
        longitude?: unknown;
      };
    };
    expect(typeof station.node_id).toBe("string");
    if (station.location) {
      expect(station.location.latitude === null || typeof station.location.latitude === "number").toBe(
        true,
      );
      expect(
        station.location.longitude === null || typeof station.location.longitude === "number",
      ).toBe(true);
    }
  }
};

describe.sequential("pfs endpoints against live API", () => {
  const client = createClient();

  test("fetch all PFS fuel prices", async () => {
    const res = await client.getAllPFSFuelPrices();
    assertFuelPricesResponse(res);
  });

  test("fetch incremental PFS fuel prices using a date-only string", async () => {
    // Use a future date so the live test validates accepted formats without large pagination runs.
    const res = await client.getIncrementalPFSFuelPrices(FUTURE_EFFECTIVE_START);
    assertFuelPricesResponse(res);
  });

  test("fetch PFS info", async () => {
    const res = await client.getPFSInfo();
    assertPfsInfoResponse(res);
  });

  test("fetch incremental PFS info using a date-only string", async () => {
    const res = await client.getIncrementalPFSInfo(FUTURE_EFFECTIVE_START);
    assertPfsInfoResponse(res);
  });

  negativeLiveTest("rejects unauthorized when token is invalid", async () => {
    const badClient = new FuelFinderClient({
      clientId: "invalid-client",
      clientSecret: "invalid-secret",
    });

    await expect(badClient.getPFSInfo()).rejects.toBeInstanceOf(FuelFinderApiError);
  });

  test("accepts Date for incremental PFS fuel prices", async () => {
    const res = await client.getIncrementalPFSFuelPrices(FUTURE_EFFECTIVE_START_DATE);
    assertFuelPricesResponse(res);
  });

  test("accepts Date for incremental PFS info", async () => {
    const res = await client.getIncrementalPFSInfo(FUTURE_EFFECTIVE_START_DATE);
    assertPfsInfoResponse(res);
  });

  test("rejects invalid timestamp strings for incremental fuel prices", async () => {
    await expect(createClient().getIncrementalPFSFuelPrices("2025/09/05")).rejects.toThrow(
      "Invalid timestamp format for effective-start-timestamp. Expected YYYY-MM-DD or YYYY-MM-DD HH:MM:SS.",
    );
  });

  test("rejects invalid Date for incremental info", async () => {
    await expect(createClient().getIncrementalPFSInfo(new Date("nope"))).rejects.toThrow(
      "Invalid Date provided for effective-start-timestamp.",
    );
  });
});
