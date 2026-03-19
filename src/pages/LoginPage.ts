import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly createAccountLink: Locator;

  constructor(page: Page) {
    super(page);
    // Using ID selectors for form fields
    this.emailInput = page.locator('#field-email');
    this.passwordInput = page.locator('#field-password');
    // Using getByRole for semantic button identification
    this.loginButton = page.getByRole('button', { name: 'Sign in' });
    this.createAccountLink = page.getByRole('link', { name: 'No account? Create one here' });
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async clickCreateAccount(): Promise<void> {
    await this.createAccountLink.click();
  }
}