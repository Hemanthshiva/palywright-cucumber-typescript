import { IWorldOptions, World, setWorldConstructor } from '@cucumber/cucumber';
import { BrowserContext, Page } from '@playwright/test';
import { ITestCaseHookParameter } from '@cucumber/cucumber';
import { TestContext } from './testContext';

export class CustomWorld extends World {
  context!: BrowserContext;
  page!: Page;
  testContext: TestContext;
  testCase?: ITestCaseHookParameter;

  constructor(options: IWorldOptions) {
    super(options);
    this.testContext = new TestContext();
  }
}

setWorldConstructor(CustomWorld);