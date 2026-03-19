const fs = require('fs');
const path = require('path');

function ts() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

const historyDir = path.join('reports', 'history');
const jsonReport = path.join('reports', 'json', 'cucumber_report.json');

if (!fs.existsSync(historyDir)) {
  fs.mkdirSync(historyDir, { recursive: true });
}

if (fs.existsSync(jsonReport)) {
  const runDir = path.join(historyDir, ts());
  fs.mkdirSync(runDir, { recursive: true });
  fs.copyFileSync(jsonReport, path.join(runDir, 'cucumber_report.json'));
  console.log('Created history run in ' + runDir);
} else {
  console.error('Source report not found: ' + jsonReport);
}
