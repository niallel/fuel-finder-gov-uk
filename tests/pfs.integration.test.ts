import { test, expect } from "vitest";
import { FuelFinderClient, FuelFinderApiError } from "../dist";

const client = new FuelFinderClient({
  clientId: process.env.FUEL_FINDER_CLIENT_ID as string,
  clientSecret: process.env.FUEL_FINDER_CLIENT_SECRET as string,
});

const assertFuelPricesResponse = (res: unknown) => {
  expect(Array.isArray(res)).toBe(true);
  if (Array.isArray(res) && res.length > 0) {
    const station = res[0] as { node_id?: string; fuel_prices?: unknown[] };
    expect(typeof station.node_id).toBe("string");
    expect(Array.isArray(station.fuel_prices)).toBe(true);
  }
};

const assertPfsInfoResponse = (res: unknown) => {
  expect(Array.isArray(res)).toBe(true);
  if (Array.isArray(res) && res.length > 0) {
    const station = res[0] as { node_id?: string };
    expect(typeof station.node_id).toBe("string");
  }
};

test("fetch all PFS fuel prices", async () => {
  const res = await client.getAllPFSFuelPrices();
  assertFuelPricesResponse(res);
});

test("fetch incremental PFS fuel prices", async () => {
  const res = await client.getIncrementalPFSFuelPrices("2025-09-05 00:00:00");
  assertFuelPricesResponse(res);
});

test("fetch PFS info", async () => {
  const res = await client.getPFSInfo();
  assertPfsInfoResponse(res);
});

test("fetch incremental PFS info", async () => {
  const res = await client.getIncrementalPFSInfo("2025-09-05 00:00:00");
  assertPfsInfoResponse(res);
});

test("rejects unauthorized when token is invalid", async () => {
  const badClient = new FuelFinderClient({
    clientId: "invalid-client",
    clientSecret: "invalid-secret",
  });

  await expect(badClient.getPFSInfo()).rejects.toBeInstanceOf(FuelFinderApiError);
});

test("accepts Date for incremental PFS fuel prices", async () => {
  const res = await client.getIncrementalPFSFuelPrices(new Date("2025-09-05T00:00:00Z"));
  assertFuelPricesResponse(res);
});

test("accepts Date for incremental PFS info", async () => {
  const res = await client.getIncrementalPFSInfo(new Date("2025-09-05T00:00:00Z"));
  assertPfsInfoResponse(res);
});

test("rejects invalid timestamp strings for incremental fuel prices", async () => {
  await expect(client.getIncrementalPFSFuelPrices("2025-09-05")).rejects.toThrow(
    "Invalid timestamp format for effective-start-timestamp.",
  );
});

test("rejects invalid Date for incremental info", async () => {
  await expect(client.getIncrementalPFSInfo(new Date("nope"))).rejects.toThrow(
    "Invalid Date provided for effective-start-timestamp.",
  );
});
