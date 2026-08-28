import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./src/tests/setup.ts"],
    // Browser E2E tests are executed by Playwright through `test:e2e`.
    // Keep Vitest limited to unit and component tests under the application source.
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
