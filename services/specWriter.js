import fs from "node:fs/promises";
import path from "node:path";

export async function writeGeneratedSpec(scenarios) {
  const generatedDir = path.resolve("generated");

  await fs.mkdir(generatedDir, { recursive: true });

  const casesPath = path.join(generatedDir, "test-cases.json");
  const specPath = path.join(generatedDir, "ai-form.spec.js");

  await fs.writeFile(casesPath, JSON.stringify(scenarios, null, 2), "utf8");

  const specContent = `import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const scenarios = JSON.parse(
  fs.readFileSync(new URL("./test-cases.json", import.meta.url), "utf8")
);

const screenshotDir = path.resolve(
  process.cwd(),
  process.env.SCREENSHOT_DIR || "screenshots"
);

test.describe("AI generated form validation tests", () => {
  test.beforeAll(() => {
    fs.mkdirSync(screenshotDir, { recursive: true });
  });

  for (const [index, scenario] of scenarios.entries()) {
    test(\`\${scenario.id} - \${scenario.title}\`, async ({ page }) => {
      const screenshotPath = path.join(
        screenshotDir,
        \`test-\${index + 1}.png\`
      );

      await page.goto("/");

      try {
        await expect(
          page.getByRole("heading", { name: "Test Form" })
        ).toBeVisible();

        await page.getByTestId("name-input").fill(scenario.data.name);
        await page.getByTestId("email-input").fill(scenario.data.email);
        await page.getByTestId("phone-input").fill(scenario.data.phone);
        await page.getByTestId("city-input").fill(scenario.data.city);
        await page.getByTestId("message-input").fill(scenario.data.message);

        await page.getByTestId("submit").click();

        const result = page.getByTestId("form-result");

        await expect(result).toBeVisible();

        if (scenario.expected === "success") {
          await expect(result).toHaveAttribute("data-status", "success");
          await expect(result).toContainText("Form submitted successfully.");
        } else {
          await expect(result).toHaveAttribute("data-status", "error");
          await expect(result).toContainText("Please fix the validation errors.");

          for (const [field, expectedMessage] of Object.entries(
            scenario.expectedErrors || {}
          )) {
            const errorLocator = page.locator(\`[data-error-for="\${field}"]\`);
            await expect(errorLocator).toBeVisible();
            await expect(errorLocator).toContainText(expectedMessage);
          }
        }
      } finally {
        await page.screenshot({
          path: screenshotPath,
          fullPage: true
        }).catch(() => {});
      }
    });
  }
});
`;

  await fs.writeFile(specPath, specContent, "utf8");

  return {
    casesPath: path.relative(process.cwd(), casesPath),
    specPath: path.relative(process.cwd(), specPath)
  };
}