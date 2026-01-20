import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "tests/**/*.test.{ts,js}",
      "tests/**/*.spec.{ts,js}",
      "tests/**/*.integration.{ts,js}",
      "tests/**/*.vitest.{ts,js}",
    ],
    setupFiles: ["tests/setup-env.ts"],
  },
});
