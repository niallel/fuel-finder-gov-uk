import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 300000,
    // The live Fuel Finder API can revoke tokens across parallel workers.
    fileParallelism: false,
    include: [
      "tests/**/*.test.{ts,js}",
      "tests/**/*.spec.{ts,js}",
      "tests/**/*.integration.{ts,js}",
      "tests/**/*.vitest.{ts,js}",
    ],
    setupFiles: ["tests/setup-env.ts"],
  },
});
