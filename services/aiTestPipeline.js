import fs from "node:fs/promises";
import path from "node:path";

import { formContract } from "./formContract.js";
import { generateScenarios } from "./gemini.js";
import { normalizeScenarios } from "./scenarioNormalizer.js";
import { writeGeneratedSpec } from "./specWriter.js";
import { runPlaywright } from "./playwrightRunner.js";
import { buildHtmlSummary } from "./reportGenerator.js";

async function ensureCleanOutputDirs() {
  await fs.mkdir("generated", { recursive: true });
  await fs.mkdir("reports", { recursive: true });
  await fs.mkdir("screenshots", { recursive: true });
  await fs.mkdir("test-results", { recursive: true });

  const screenshotFiles = await fs.readdir("screenshots").catch(() => []);

  await Promise.all(
    screenshotFiles
      .filter((file) => file.endsWith(".png"))
      .map((file) => fs.rm(path.join("screenshots", file), { force: true }))
  );
}

export async function runAiTestPipeline({ baseUrl, headed = false } = {}) {
  if (!baseUrl) {
    throw new Error("baseUrl is required for running Playwright tests.");
  }

  await ensureCleanOutputDirs();

  const desiredCount = Number(process.env.SCENARIO_COUNT || 10);

  const rawGeminiScenarios = await generateScenarios({
    formContract,
    count: desiredCount
  });

  const scenarios = normalizeScenarios(
    rawGeminiScenarios,
    formContract,
    desiredCount
  );

  const generated = await writeGeneratedSpec(scenarios);

  const playwrightResult = await runPlaywright({
    specPath: generated.specPath,
    baseUrl,
    headed
  });

  const report = await buildHtmlSummary({
    scenarios,
    runResult: playwrightResult,
    outputPath: "reports/report.html"
  });

  return {
    ok: playwrightResult.ok,
    baseUrl,
    generated,
    report,
    playwrightReport: "reports/playwright-report/index.html",
    totals: {
      total: playwrightResult.total,
      passed: playwrightResult.passed,
      failed: playwrightResult.failed,
      skipped: playwrightResult.skipped
    },
    screenshots: playwrightResult.screenshots,
    scenarios,
    results: playwrightResult.tests,
    error:
      playwrightResult.ok === false
        ? "One or more Playwright tests failed. Check the report and screenshots."
        : undefined
  };
}