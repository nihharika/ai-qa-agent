import "dotenv/config";

import { startServer } from "../server.js";
import { runAiTestPipeline } from "../services/aiTestPipeline.js";

const port = Number(process.env.PORT || 3000);

let serverInfo;

try {
  serverInfo = await startServer(port);

  const result = await runAiTestPipeline({
    baseUrl: serverInfo.url,
    headed: process.env.HEADED === "true"
  });

  console.log(JSON.stringify(result, null, 2));

  console.log("\nReports:");
  console.log("- Summary: reports/report.html");
  console.log("- Playwright: reports/playwright-report/index.html");

  process.exitCode = result.ok ? 0 : 1;
} catch (error) {
  console.error("AI test runner failed:", error);
  process.exitCode = 1;
} finally {
  if (serverInfo?.server) {
    await new Promise((resolve) => serverInfo.server.close(resolve));
  }
}