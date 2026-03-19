import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { User } from '../types/user';

export class RegisterPage extends BasePage {
  private readonly socialTitleMrRadio: Locator;
  private readonly socialTitleMrsRadio: Locator;
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly birthDateInput: Locator;
  private readonly receiveOffersCheckbox: Locator;
  private readonly agreeTermsCheckbox: Locator;
  private readonly newsletterCheckbox: Locator;
  private readonly registerButton: Locator;

  constructor(page: Page) {
    super(page);
    // Social Title - using more flexible selectors for radio buttons
    // Try multiple approaches to find the radio button
    this.socialTitleMrRadio = page.locator('input[id*="gender"][class*="custom"], input[name="id_gender"]').first();
    this.socialTitleMrsRadio = page.locator('label').filter({ hasText: 'Mrs.' }).locator('input');
    // Form inputs - using ID selectors to avoid newsletter fields
    this.firstNameInput = page.locator('#field-firstname');
    this.lastNameInput = page.locator('#field-lastname');
    this.emailInput = page.locator('#field-email');
    this.passwordInput = page.locator('#field-password');
    this.birthDateInput = page.locator('#field-birthday');
    // Checkboxes - using input name selectors
    this.receiveOffersCheckbox = page.locator('input[name="optin"]');
    this.agreeTermsCheckbox = page.locator('input[name="psgdpr"]');
    this.newsletterCheckbox = page.locator('input[name="newsletter"]');
    // Save button - using getByRole for semantic HTML
    this.registerButton = page.getByRole('button', { name: 'Save' });
  }

  async setSocialTitle(title: string): Promise<void> {
    try {
      if (title === 'Mrs.' || title === '2') {
        // Click the Mrs radio button by looking for associated label with "Mrs"
        const mrsLabel = this.page.locator('label:has-text("Mrs")').first();
        await mrsLabel.click();
      } else {
        // Click the Mr radio button by looking for associated label with "Mr"
        const mrLabel = this.page.locator('label:has-text("Mr")').first();
        await mrLabel.click();
      }
    } catch (e) {
      // Fallback: try using getByLabel
      if (title === 'Mrs.' || title === '2') {
        await this.page.getByLabel('Mrs.').check();
      } else {
        await this.page.getByLabel('Mr.').check();
      }
    }
  }

  async registerUser(user: User): Promise<void> {
    if (user.socialTitle) {
      await this.setSocialTitle(user.socialTitle);
    }
    await this.firstNameInput.fill(user.firstName!);
    await this.lastNameInput.fill(user.lastName!);
    await this.emailInput.fill(user.email!);
    await this.passwordInput.fill(user.password!);
    
    if (user.birthDate) {
      await this.birthDateInput.fill(user.birthDate);
    }
    
    if (user.receiveOffers) {
      await this.receiveOffersCheckbox.check();
    }
    
    // Always check the terms and conditions
    if (user.agreeTerms) {
      await this.agreeTermsCheckbox.check();
    }
    
    if (user.newsletter) {
      await this.newsletterCheckbox.check();
    }
    
    await this.registerButton.click();
  }
}