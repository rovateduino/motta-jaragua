import { defineConfig, devices } from "@playwright/test";
import { join } from "path";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";
const hasExternalServer = Boolean(process.env.E2E_BASE_URL);

// No CI usamos o Chromium instalado pelo Playwright; localmente mantemos o
// Chrome já instalado na máquina para não exigir download extra.
const browserChannel = process.env.CI ? undefined : ("chrome" as const);

// Caminho absoluto para o SQLite de teste (forward slashes p/ Windows).
const testDbPath = join(__dirname, "packages/db/prisma/test.db").replace(/\\/g, "/");
const testDatabaseUrl = `file:${testDbPath}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  webServer: hasExternalServer
    ? undefined
    : {
        // -v DATABASE_URL=... injeta via Object.assign (sobrepõe).
        // O dotenv -e ../../.env interno do script dev não sobrescreve (override=false por padrão).
        command: `dotenv -v DATABASE_URL="${testDatabaseUrl}" -- npm run dev -w @motta/web -- --port 3100`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
      },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        channel: browserChannel,
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
        channel: browserChannel,
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
