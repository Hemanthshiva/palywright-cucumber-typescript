const fs = require('fs');
const path = require('path');

/**
 * Enhanced Dashboard Generator
 * Creates a modern, responsive, and professional test results dashboard.
 * Features:
 * - High-level metrics (Pass Rate, Total Runs, Flaky Tests)
 * - Interactive charts using Chart.js
 * - Detailed run history with status indicators
 * - Flaky/Consistently failing test classification
 * - Professional dark-themed UI with status-specific coloring
 */

const HISTORY_DIR = path.join(process.cwd(), 'reports', 'history');
const DASHBOARD_DIR = path.join(process.cwd(), 'dashboard');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getLastNRuns(n = 10) {
  if (!fs.existsSync(HISTORY_DIR)) return [];
  const entries = fs.readdirSync(HISTORY_DIR).filter(e => fs.statSync(path.join(HISTORY_DIR, e)).isDirectory());
  // Sort by name descending (assuming timestamped folder names like YYYYMMDD-HHMMSS)
  entries.sort((a, b) => b.localeCompare(a));
  return entries.slice(0, n);
}

function generate() {
  const runs = getLastNRuns(10);
  if (runs.length === 0) {
    console.log('No historical runs found in reports/history. Run tests and persist them first.');
    return;
  }

  ensureDir(DASHBOARD_DIR);

  const runsData = [];
  const allTestsAggregation = {}; // { 'Scenario Name': { pass: 0, fail: 0, total: 0, history: [] } }

  // Process each run
  runs.forEach(runId => {
    const runDir = path.join(HISTORY_DIR, runId);
    const jsonFiles = fs.readdirSync(runDir).filter(f => f.endsWith('.json'));
    
    let runPassed = true;
    let runDurationNs = 0;
    let runTimestamp = null;
    const testsInRun = [];

    jsonFiles.forEach(file => {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(runDir, file), 'utf8'));
        if (Array.isArray(content)) {
          content.forEach(feature => {
            feature.elements?.forEach(scenario => {
              if (scenario.type !== 'scenario') return;

              const scenarioName = scenario.name || 'Unnamed Scenario';
              let scenarioPassed = true;
              let scenarioDuration = 0;

              scenario.steps?.forEach(step => {
                if (step.result) {
                  if (step.result.status && step.result.status !== 'passed' && step.result.status !== 'skipped') {
                    scenarioPassed = false;
                    runPassed = false;
                  }
                  if (step.result.duration) scenarioDuration += Number(step.result.duration);
                  if (step.result.timestamp && !runTimestamp) runTimestamp = new Date(step.result.timestamp).getTime();
                }
              });

              runDurationNs += scenarioDuration;
              testsInRun.push({ name: scenarioName, passed: scenarioPassed, duration: scenarioDuration });

              // Aggregation for flaky/fail analysis
              if (!allTestsAggregation[scenarioName]) {
                allTestsAggregation[scenarioName] = { pass: 0, fail: 0, total: 0, history: [] };
              }
              const agg = allTestsAggregation[scenarioName];
              agg.total++;
              if (scenarioPassed) agg.pass++; else agg.fail++;
              agg.history.push({ runId, passed: scenarioPassed });
            });
          });
        }
      } catch (e) {
        console.error(`Error parsing ${file} in ${runId}:`, e.message);
      }
    });

    // Fallback timestamp if not found in JSON
    if (!runTimestamp) {
      runTimestamp = fs.statSync(runDir).mtime.getTime();
    }

    // Determine report URL (relative to dashboard/index.html)
    // In CI, reports/html/multiple-cucumber-html-reporter/* is copied to gh-pages/
    // dashboard/* is copied to gh-pages/dashboard/
    // So to go from dashboard/index.html to a run's report:
    // We need to know where the run's report is.
    // Based on ci.yml, history is kept in reports/history/<ts>/*.json
    // But the HTML report is ONLY the latest one at the root of gh-pages.
    // The requirement says "link to each run's cucumber-html-report".
    // Since we only keep ONE full HTML report on Pages (the latest), 
    // we link the latest run to '../index.html' and others to '-' unless we change CI.
    // For now, let's assume the latest run is the main one.
    const isLatest = runsData.length === 0;
    const reportLink = isLatest ? '../index.html' : null;

    runsData.push({
      runId,
      timestamp: runTimestamp,
      passed: runPassed,
      durationMs: Math.round(runDurationNs / 1e6),
      testCount: testsInRun.length,
      passCount: testsInRun.filter(t => t.passed).length,
      failCount: testsInRun.filter(t => !t.passed).length,
      reportLink
    });
  });

  // Sort by timestamp desc
  runsData.sort((a, b) => b.timestamp - a.timestamp);

  // Global Stats
  const totalRuns = runsData.length;
  const passedRunsCount = runsData.filter(r => r.passed).length;
  const globalPassRate = totalRuns > 0 ? Math.round((passedRunsCount / totalRuns) * 100) : 0;

  // Identify Flaky and Failing Tests
  const flakyTests = [];
  const failingTests = [];

  Object.entries(allTestsAggregation).forEach(([name, stats]) => {
    const passRate = stats.pass / stats.total;
    if (stats.fail > 0 && stats.pass > 0) {
      flakyTests.push({ name, ...stats, passRate });
    } else if (stats.pass === 0 && stats.total > 1) {
      failingTests.push({ name, ...stats, passRate });
    }
  });

  // Sort lists
  flakyTests.sort((a, b) => b.fail - a.fail);
  failingTests.sort((a, b) => b.total - a.total);

  // HTML Generation
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Playwright Test Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <style>
        :root {
            --bg-main: #0f172a;
            --bg-card: #1e293b;
            --text-main: #f1f5f9;
            --text-muted: #94a3b8;
            --accent-pass: #22c55e;
            --accent-fail: #ef4444;
            --accent-warn: #f59e0b;
            --accent-info: #3b82f6;
        }
        body { background-color: var(--bg-main); color: var(--text-main); font-family: 'Inter', sans-serif; }
        .card { background-color: var(--bg-card); border-radius: 0.75rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .status-pass { color: var(--accent-pass); }
        .status-fail { color: var(--accent-fail); }
        .status-warn { color: var(--accent-warn); }
        .badge-pass { background-color: rgba(34, 197, 94, 0.2); color: var(--accent-pass); border: 1px solid rgba(34, 197, 94, 0.3); }
        .badge-fail { background-color: rgba(239, 68, 68, 0.2); color: var(--accent-fail); border: 1px solid rgba(239, 68, 68, 0.3); }
        table { width: 100%; border-collapse: separate; border-spacing: 0; }
        th { background-color: rgba(255, 255, 255, 0.03); color: var(--text-muted); font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
        td, th { padding: 1rem; text-align: left; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        tr:hover td { background-color: rgba(255, 255, 255, 0.02); }
        .chart-container { position: relative; height: 300px; width: 100%; }
    </style>
</head>
<body class="p-6 md:p-12">
    <div class="max-w-7xl mx-auto">
        <header class="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 class="text-3xl font-bold tracking-tight">Test Automation Dashboard</h1>
                <p class="text-slate-400 mt-1">Historical insights from the last ${totalRuns} runs</p>
            </div>
            <div class="flex gap-3">
                <a href="../index.html" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors">
                    View Latest Report
                </a>
            </div>
        </header>

        <!-- Metrics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div class="card p-6">
                <p class="text-slate-400 text-sm font-medium mb-1">Pass Rate</p>
                <div class="flex items-end gap-2">
                    <span class="text-4xl font-bold ${globalPassRate >= 90 ? 'status-pass' : globalPassRate >= 70 ? 'status-warn' : 'status-fail'}">${globalPassRate}%</span>
                </div>
            </div>
            <div class="card p-6">
                <p class="text-slate-400 text-sm font-medium mb-1">Total Runs</p>
                <span class="text-4xl font-bold">${totalRuns}</span>
            </div>
            <div class="card p-6">
                <p class="text-slate-400 text-sm font-medium mb-1">Flaky Tests</p>
                <span class="text-4xl font-bold ${flakyTests.length > 0 ? 'status-warn' : ''}">${flakyTests.length}</span>
            </div>
            <div class="card p-6">
                <p class="text-slate-400 text-sm font-medium mb-1">Latest Run Status</p>
                <span class="text-4xl font-bold ${runsData[0].passed ? 'status-pass' : 'status-fail'}">${runsData[0].passed ? 'PASSED' : 'FAILED'}</span>
            </div>
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div class="card p-6">
                <h3 class="text-lg font-semibold mb-6">Pass Rate Trend</h3>
                <div class="chart-container">
                    <canvas id="passRateChart"></canvas>
                </div>
            </div>
            <div class="card p-6">
                <h3 class="text-lg font-semibold mb-6">Execution Duration (s)</h3>
                <div class="chart-container">
                    <canvas id="durationChart"></canvas>
                </div>
            </div>
        </div>

        <!-- Flaky Tests Section -->
        ${flakyTests.length > 0 || failingTests.length > 0 ? `
        <div class="grid grid-cols-1 gap-8 mb-10">
            <div class="card overflow-hidden">
                <div class="p-6 border-b border-white/5">
                    <h3 class="text-lg font-semibold">Stability Issues</h3>
                </div>
                <div class="overflow-x-auto">
                    <table>
                        <thead>
                            <tr>
                                <th>Test Case Name</th>
                                <th>Status</th>
                                <th>Pass Rate</th>
                                <th>Failed</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${failingTests.map(t => `
                                <tr>
                                    <td class="font-medium">${t.name}</td>
                                    <td><span class="px-2 py-1 rounded text-xs font-bold badge-fail">CONSISTENTLY FAILING</span></td>
                                    <td class="status-fail">0%</td>
                                    <td>${t.fail}</td>
                                    <td>${t.total}</td>
                                </tr>
                            `).join('')}
                            ${flakyTests.map(t => `
                                <tr>
                                    <td class="font-medium">${t.name}</td>
                                    <td><span class="px-2 py-1 rounded text-xs font-bold badge-fail" style="background-color: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);">FLAKY</span></td>
                                    <td class="${t.passRate >= 0.8 ? 'status-pass' : t.passRate >= 0.5 ? 'status-warn' : 'status-fail'}">${Math.round(t.passRate * 100)}%</td>
                                    <td>${t.fail}</td>
                                    <td>${t.total}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Run History Table -->
        <div class="card overflow-hidden">
            <div class="p-6 border-b border-white/5">
                <h3 class="text-lg font-semibold">Run History</h3>
            </div>
            <div class="overflow-x-auto">
                <table>
                    <thead>
                        <tr>
                            <th>Execution Time</th>
                            <th>Status</th>
                            <th>Passed</th>
                            <th>Failed</th>
                            <th>Duration</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${runsData.map(r => `
                            <tr>
                                <td class="font-medium">${new Date(r.timestamp).toLocaleString()}</td>
                                <td>
                                    <span class="px-3 py-1 rounded-full text-xs font-bold ${r.passed ? 'badge-pass' : 'badge-fail'}">
                                        ${r.passed ? 'PASS' : 'FAIL'}
                                    </span>
                                </td>
                                <td class="status-pass">${r.passCount}</td>
                                <td class="${r.failCount > 0 ? 'status-fail' : ''}">${r.failCount}</td>
                                <td class="text-slate-400">${Math.round(r.durationMs / 1000)}s</td>
                                <td>
                                    ${r.reportLink ? `
                                        <a href="${r.reportLink}" class="text-blue-400 hover:text-blue-300 text-sm font-medium underline underline-offset-4">
                                            Open Report
                                        </a>
                                    ` : '<span class="text-slate-600 text-sm italic">Not available</span>'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <footer class="mt-12 text-center text-slate-500 text-sm">
            Generated on ${new Date().toLocaleString()}
        </footer>
    </div>

    <script>
        const runLabels = ${JSON.stringify(runsData.map(r => new Date(r.timestamp).toLocaleTimeString()).reverse())};
        const passRates = ${JSON.stringify(runsData.map(r => Math.round((r.passCount / r.testCount) * 100)).reverse())};
        const durations = ${JSON.stringify(runsData.map(r => Math.round(r.durationMs / 1000)).reverse())};

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: '#64748b', font: { size: 10 } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                    ticks: { color: '#64748b', font: { size: 10 } }
                }
            }
        };

        // Pass Rate Chart
        new Chart(document.getElementById('passRateChart'), {
            type: 'line',
            data: {
                labels: runLabels,
                datasets: [{
                    data: passRates,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: '#3b82f6'
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    ...commonOptions.scales,
                    y: { ...commonOptions.scales.y, min: 0, max: 100 }
                }
            }
        });

        // Duration Chart
        new Chart(document.getElementById('durationChart'), {
            type: 'bar',
            data: {
                labels: runLabels,
                datasets: [{
                    data: durations,
                    backgroundColor: '#6366f1',
                    borderRadius: 4,
                    barThickness: 20
                }]
            },
            options: commonOptions
        });
    </script>
</body>
</html>`;

  fs.writeFileSync(path.join(DASHBOARD_DIR, 'index.html'), html, 'utf8');
  console.log('Dashboard generated successfully at', DASHBOARD_DIR);
}

generate();
