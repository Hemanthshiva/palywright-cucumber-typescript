import { Page, Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  constructor(page: Page) {
    this.page = page;
  }

  async navigateTo(path:string): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForTimeout(3000);
    const cookieBanner = this.page.locator('#cookie_close');
    try {
      await cookieBanner.waitFor({ state: 'visible', timeout: 5000 });
      await cookieBanner.click();
    } catch (error) {
      console.log('Cookie banner not found or already closed.');
    }
  }
}