import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  private readonly signInLink: Locator;
  private readonly userAccountLink: Locator;
  private readonly artCategoryLink: Locator;

  constructor(page: Page) {
    super(page);
    this.signInLink = page.getByRole('link', { name: ' Sign in' });
    this.userAccountLink = page.locator('a.account');
    this.artCategoryLink = page.getByRole('link', { name: 'Art' });
  }

  async clickSignIn(): Promise<void> {
    await this.signInLink.click();
    // Also navigate to account creation page
    await this.page.waitForLoadState('networkidle');
    try {
      const createAccountLink = this.page.getByRole('link', { name: 'No account? Create one here', exact: true });
      await createAccountLink.click();
      await this.page.waitForLoadState('networkidle');
    } catch (e) {
      // Already on the right page or link not available
    }
  }

  async getUserName(): Promise<string | null> {
    return await this.userAccountLink.textContent();
  }

  async navigateToArtCategory(): Promise<void> {
    // Use more specific selector to avoid strict mode violations
    const artLink = this.page.locator('a.dropdown-item[href*="id_category=9"]');
    await artLink.click();
    // Wait for page to load
    await this.page.waitForLoadState('networkidle');
  }
}