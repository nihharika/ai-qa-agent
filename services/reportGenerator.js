import fs from "node:fs/promises";
import path from "node:path";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toWebPath(filePath) {
  return filePath.replaceAll(path.sep, "/");
}

export async function buildHtmlSummary({
  scenarios,
  runResult,
  outputPath = "reports/report.html"
}) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const rows = scenarios
    .map((scenario, index) => {
      const matchingTest =
        runResult.tests.find((test) => test.title.includes(scenario.id)) ||
        runResult.tests[index];

      const status = matchingTest?.status || "unknown";
      const screenshot = `../screenshots/test-${index + 1}.png`;

      return `
        <tr>
          <td>${escapeHtml(scenario.id)}</td>
          <td>${escapeHtml(scenario.title)}</td>
          <td>${escapeHtml(scenario.expected)}</td>
          <td class="${escapeHtml(status)}">${escapeHtml(status)}</td>
          <td>
            <a href="${toWebPath(screenshot)}" target="_blank">Screenshot</a>
          </td>
        </tr>
      `;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>AI QA Agent Report</title>
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 32px;
      background: #f8fafc;
      color: #111827;
    }

    h1 {
      margin-bottom: 8px;
    }

    .summary {
      display: flex;
      gap: 16px;
      margin: 24px 0;
    }

    .box {
      background: #ffffff;
      border-radius: 12px;
      padding: 16px 20px;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
    }

    th,
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
      vertical-align: top;
    }

    th {
      background: #111827;
      color: white;
    }

    .passed {
      color: #15803d;
      font-weight: 700;
    }

    .failed,
    .timedOut,
    .interrupted {
      color: #dc2626;
      font-weight: 700;
    }

    .skipped {
      color: #a16207;
      font-weight: 700;
    }

    pre {
      white-space: pre-wrap;
      background: #0f172a;
      color: #e5e7eb;
      padding: 16px;
      border-radius: 10px;
      overflow: auto;
    }

    a {
      color: #2563eb;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <h1>AI QA Agent Report</h1>
  <p>Generated at ${escapeHtml(new Date().toLocaleString())}</p>

  <div class="summary">
    <div class="box">Total: <strong>${runResult.total}</strong></div>
    <div class="box">Passed: <strong>${runResult.passed}</strong></div>
    <div class="box">Failed: <strong>${runResult.failed}</strong></div>
    <div class="box">Skipped: <strong>${runResult.skipped}</strong></div>
  </div>

  <p>
    <a href="./playwright-report/index.html" target="_blank">
      Open full Playwright HTML report
    </a>
  </p>

  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Scenario</th>
        <th>Expected</th>
        <th>Status</th>
        <th>Screenshot</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <h2>Playwright stderr</h2>
  <pre>${escapeHtml((runResult.cli.stderr || "").slice(0, 5000))}</pre>
</body>
</html>`;

  await fs.writeFile(outputPath, html, "utf8");

  return {
    path: outputPath
  };
}