const report = require('multiple-cucumber-html-reporter');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Get runtime environment details
const getBrowser = () => {
  return process.env.BROWSER || 'chromium';
};

const getPlatformInfo = () => {
  const platform = os.platform();
  const arch = os.arch();
  const release = os.release();
  
  const platformName = {
    'win32': 'Windows',
    'darwin': 'macOS',
    'linux': 'Linux',
  }[platform] || platform;
  
  return {
    name: platformName,
    version: release,
    architecture: arch,
  };
};

const getDevice = () => {
  const isCI = process.env.CI || false;
  return isCI ? 'CI/CD Pipeline' : `${os.hostname()} (${os.cpus().length} CPUs)`;
};

const getExecutionTimes = () => {
  let files = [];
  const jsonDir = 'reports/json';
  try {
    files = fs.readdirSync(jsonDir).filter(f => f.endsWith('.json'));
  } catch (e) {
    return { startTime: new Date(), endTime: new Date() };
  }

  let earliestTimestamp = Infinity;
  let latestTimestamp = 0;
  let totalDurationNs = 0; // accumulate durations if available (nanoseconds)
  let earliestMtime = Infinity;
  let latestMtime = 0;

  files.forEach(file => {
    const filePath = path.join(jsonDir, file);
    try {
      const stats = fs.statSync(filePath);
      const mtime = stats.mtime.getTime();
      if (mtime < earliestMtime) earliestMtime = mtime;
      if (mtime > latestMtime) latestMtime = mtime;

      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (Array.isArray(content)) {
        content.forEach(feature => {
          if (feature.elements) {
            feature.elements.forEach(scenario => {
              if (scenario.steps) {
                scenario.steps.forEach(step => {
                  if (step.result) {
                    if (step.result.timestamp) {
                      const ts = new Date(step.result.timestamp).getTime();
                      if (ts && ts < earliestTimestamp) earliestTimestamp = ts;
                      if (ts && ts > latestTimestamp) latestTimestamp = ts;
                    }
                    if (step.result.duration) {
                      const d = Number(step.result.duration);
                      if (!Number.isNaN(d) && d > 0) totalDurationNs += d;
                    }
                  }
                });
              }
            });
          }
        });
      }
    } catch (error) {
      console.log(`Error reading ${file}:`, error.message);
    }
  });

  const now = Date.now();

  // Prefer explicit timestamps from JSON if they vary
  if (earliestTimestamp !== Infinity && latestTimestamp > earliestTimestamp) {
    return { startTime: new Date(earliestTimestamp), endTime: new Date(latestTimestamp) };
  }

  // If durations are available, infer start time from latest mtime or now
  if (totalDurationNs > 0) {
    const totalMs = Math.round(totalDurationNs / 1e6);
    const end = latestMtime !== 0 ? latestMtime : now;
    const start = end - totalMs;
    return { startTime: new Date(start), endTime: new Date(end) };
  }

  // Fallback to file modification times if available
  if (earliestMtime !== Infinity && latestMtime !== 0 && latestMtime > earliestMtime) {
    return { startTime: new Date(earliestMtime), endTime: new Date(latestMtime) };
  }

  // Last resort: return now for both
  return { startTime: new Date(now), endTime: new Date(now) };
};

const formatDateTime = (date) => {
  return date.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

const calculateExecutionTime = (startDate, endDate) => {
  const diffMs = endDate - startDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffSecs = Math.floor((diffMs % 60000) / 1000);
  
  if (diffMins > 0) {
    return `${diffMins}m ${diffSecs}s`;
  }
  return `${diffSecs}s`;
};

// Get all runtime information
const browser = getBrowser();
const platform = getPlatformInfo();
const device = getDevice();
const { startTime, endTime } = getExecutionTimes();
const executionTime = calculateExecutionTime(startTime, endTime);
const isCI = process.env.CI || process.env.CONTINUOUS_INTEGRATION || false;

report.generate({
  jsonDir: 'reports/json',
  reportPath: 'reports/html/multiple-cucumber-html-reporter',
  metadata: {
    browser: {
      name: browser,
      version: 'Latest',
    },
    device: device,
    platform: {
      name: platform.name,
      version: platform.version,
      architecture: platform.architecture,
    },
    environment: isCI ? 'CI/CD' : 'Local',
    parallel: process.env.PARALLEL || '1',
  },
  customData: {
    title: 'Test Execution Summary',
    data: [
      { label: 'Project', value: 'Playwright E-commerce Demo' },
      { label: 'Browser', value: browser.charAt(0).toUpperCase() + browser.slice(1) },
      { label: 'Environment', value: isCI ? 'CI/CD Pipeline' : 'Local Machine' },
      { label: 'Device', value: device },
      { label: 'Execution Start Time', value: formatDateTime(startTime) },
      { label: 'Execution End Time', value: formatDateTime(endTime) },
      { label: 'Total Execution Time', value: executionTime },
    ],
  },
});