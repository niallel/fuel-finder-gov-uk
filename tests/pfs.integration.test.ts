import { test, expect } from "vitest";
import { FuelFinderClient, FuelFinderApiError } from "../dist";

const client = new FuelFinderClient({
  clientId: process.env.FUEL_FINDER_CLIENT_ID as string,
  clientSecret: process.env.FUEL_FINDER_CLIENT_SECRET as string,
});

test("fetch all PFS fuel prices", async () => {
  const res = await client.getAllPFSFuelPrices();
  expect(res.data).toBeDefined();
  expect(res.data.data).toBeDefined();
  expect(Array.isArray(res.data.data)).toBe(true);
});

test("fetch incremental PFS fuel prices", async () => {
  const res = await client.getIncrementalPFSFuelPrices("2025-09-05");
  expect(res.data).toBeDefined();
  expect(res.data.data).toBeDefined();
  expect(Array.isArray(res.data.data)).toBe(true);
});

test("fetch PFS info", async () => {
  const res = await client.getPFSInfo();
  expect(res.data).toBeDefined();
  expect(res.data.data).toBeDefined();
  expect(Array.isArray(res.data.data)).toBe(true);
}, 15000);

test("fetch incremental PFS info", async () => {
  const res = await client.getIncrementalPFSInfo("2025-09-05");
  expect(res.data).toBeDefined();
  expect(res.data.data).toBeDefined();
  expect(Array.isArray(res.data.data)).toBe(true);
}, 15000);

test("rejects unauthorized when token is invalid", async () => {
  const badClient = new FuelFinderClient({
    clientId: "invalid-client",
    clientSecret: "invalid-secret",
  });

  await expect(badClient.getPFSInfo()).rejects.toBeInstanceOf(FuelFinderApiError);
});
