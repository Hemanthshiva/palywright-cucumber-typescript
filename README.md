# Playwright E-commerce Demo

Enterprise-level test automation framework using Playwright, TypeScript, and Cucumber.js.

## 🚀 Quick Start

### Installation

1. Clone the repository.
2. Install dependencies:

```bash
npm install
npx playwright install --with-deps
```

## 🧪 Running Tests

- **Run all tests**: `npm test`
- **Run tests in headed mode**: `npm run test:headed`
- **Run tests by browser**:
  - Chrome: `npm run test:chrome`
  - Firefox: `npm run test:firefox`
  - WebKit: `npm run test:webkit`
- **Run specific browser (headed)**: `npm run test:chrome:headed`
- **Debug mode**: `npm run test:debug`
- **CI mode**: `npm run test:ci` (headless, optimized for CI/CD)
- **Run by tags**: `npm run test:tags @smoke`

## 📊 Test Reports

### Local Report Generation

```bash
# Generate HTML report from test results
npm run report:generate

# Generate historical dashboard (requires multiple runs)
npm run dashboard:generate

# Run tests and generate report in one command
npm run test:and:report
```

### GitHub Pages Reports

This project automatically generates and publishes test reports to GitHub Pages on every push to `main`/`master` and daily at 18:00 UTC.

**📖 Setup Instructions**: See [GITHUB_PAGES_SETUP.md](GITHUB_PAGES_SETUP.md)

#### Available Reports
- 🧪 **Latest Test Report**: Detailed Cucumber HTML report with all scenarios
- 📈 **Historical Dashboard**: Visual dashboard showing last 10 test runs
- 💾 **Test History**: JSON reports stored on `reports-history` branch

#### Accessing Reports
- Once workflow completes, reports auto-publish to: `https://<your-username>.github.io/<repo-name>`
- Direct links shared in GitHub Actions workflow summary

## 🔄 GitHub Actions Workflow

### Merged CI/CD Pipeline (`ci.yml`)

The workflow combines testing and reporting in one comprehensive pipeline:

1. ✅ **Test Execution**: Runs full test suite in headless mode
2. 📊 **Report Generation**: Creates Cucumber HTML and multiple-cucumber-html reports
3. 💾 **History Persistence**: Saves JSON reports to `reports-history` branch (last 10 runs)
4. 📈 **Dashboard Generation**: Builds visual dashboard from historical data
5. 🌐 **GitHub Pages Deployment**: Publishes reports automatically
6. 📦 **Artifact Upload**: Stores reports for 30 days as workflow artifacts

**Triggers**:
- Push to `main` or `master`
- Pull requests to `main` or `master`
- Daily schedule: 18:00 UTC

## 📁 Project Structure

```
src/
├── features/              # Gherkin feature files
├── pages/                 # Page Object Model classes
├── step-definitions/      # Cucumber step implementations
├── support/               # Test hooks, world, reporter
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions (random, faker, config)

scripts/
└── generate-dashboard.js  # Generates visual dashboard from test history (last 10 runs)

.github/workflows/
└── ci.yml                 # Merged test & report workflow
```

## 🔧 Code Quality

### Linting and Formatting

- **Lint code**: `npm run lint`
- **Fix linting issues**: `npm run lint:fix`
- **Format code**: `npm run format`
- **Check formatting**: `npm run format:check`

## 🧹 Maintenance

### Clean Generated Files

```bash
npm run clean
# Removes: reports/, test-results/, coverage/, etc.
```

## 🐛 Troubleshooting

### Environment Variables
- If env var scripts fail on Windows, the project includes `cross-env`
- All npm scripts use `cross-env` for cross-platform compatibility

### Playwright Installation
- If browsers fail to install: `npx playwright install --with-deps`
- Ensure you have system dependencies installed

### Test Failures
- Use debug mode: `npm run test:debug`
- Check individual browser runs (Chrome/Firefox/WebKit)
- Review report HTML for step details

### GitHub Pages Issues
- Verify Settings → Pages → Source = "GitHub Actions"
- Check Actions tab for workflow completion
- Clear browser cache (Ctrl+Shift+Del or Cmd+Shift+Del)
- See [GITHUB_PAGES_SETUP.md](GITHUB_PAGES_SETUP.md) for detailed troubleshooting

## 📝 Contributing

### Adding Tests

1. **Create feature file** in `src/features/` (Gherkin syntax)
2. **Implement steps** in `src/step-definitions/`
3. **Create page classes** in `src/pages/` (Page Object Model)
4. **Run and verify**: `npm test`

### Code Organization

- Keep page classes focused (one main page = one class)
- Use TypeScript for type safety
- Follow existing naming conventions
- Add JSDoc comments for complex methods

## 📄 License

ISC

License: ISC