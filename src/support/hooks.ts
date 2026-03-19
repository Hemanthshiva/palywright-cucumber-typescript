import { Before, After, BeforeAll, AfterAll, ITestCaseHookParameter, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, Browser, Page, BrowserContext } from '@playwright/test';
import { env } from '../utils/envConfig';
import { CustomWorld } from './world';

setDefaultTimeout(60 * 1000);

let browser: Browser;

BeforeAll(async () => {
  browser = await chromium.launch({ headless: env.HEADLESS });
});

Before(async function (this: CustomWorld, testCase: ITestCaseHookParameter) {
  this.context = await browser.newContext({ baseURL: env.BASE_URL });
  this.page = await this.context.newPage();
  this.testCase = testCase;
});

After(async function (this: CustomWorld, { result }: ITestCaseHookParameter) {
  if (result?.status === 'FAILED') {
    const screenshot = await this.page.screenshot({ path: `reports/screenshots/${this.testCase?.pickle.name}.png`, fullPage: true });
    this.attach(screenshot, 'image/png');
  }
  await this.page.close();
  await this.context.close();
});

AfterAll(async () => {
  await browser.close();
});