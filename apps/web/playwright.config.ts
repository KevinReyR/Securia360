import { defineConfig, devices } from "@playwright/test";

const appUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";
const canStartApp = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: appUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: canStartApp
    ? {
        command: "npm run dev -- --port 3000",
        url: appUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        // The server receives only the public connection settings. The test
        // runner may use service_role for fixture setup and cleanup, but the
        // app process and browser never receive it.
        env: {
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
          NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? appUrl,
          SUPABASE_TEST_SERVICE_ROLE_KEY: "",
          SUPABASE_ACCESS_TOKEN: "",
          SUPABASE_TEST_DB_PASSWORD: "",
        },
      }
    : undefined,
});
