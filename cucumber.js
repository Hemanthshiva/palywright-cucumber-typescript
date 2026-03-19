module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: ['src/support/world.ts', 'src/support/hooks.ts', 'src/step-definitions/**/*.steps.ts'],
    format: ['json:reports/json/cucumber_report.json', 'html:reports/html/cucumber_report.html'],
    paths: ['src/features/**/*.feature'],
    publishQuiet: true,
  },
  ci: {
    requireModule: ['ts-node/register'],
    require: ['src/support/world.ts', 'src/support/hooks.ts', 'src/step-definitions/**/*.steps.ts'],
    format: ['json:reports/json/cucumber_report.json', 'html:reports/html/cucumber_report.html'],
    paths: ['src/features/**/*.feature'],
    publishQuiet: true,
    parallel: 2,
    retry: 1,
  },
};