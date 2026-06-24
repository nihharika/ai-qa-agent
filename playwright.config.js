import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: false,
  workers: 1,
  reporter: [
    ["list"],
    [
      "html",
      {
        outputFolder: "reports/playwright-report",
        open: "never"
      }
    ],
    [
      "json",
      {
        outputFile: "generated/playwright-results.json"
      }
    ]
  ],
  use: {
    baseURL: process.env.BASE_URL || "http://127.0.0.1:3000",
    headless: process.env.HEADED === "true" ? false : true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    }
  ],
  outputDir: "test-results"
});