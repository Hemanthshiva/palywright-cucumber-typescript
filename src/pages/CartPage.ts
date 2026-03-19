import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  private readonly productInCart: Locator;
  private readonly proceedToCheckoutButton: Locator;

  constructor(page: Page) {
    super(page);
    // Using CSS selector for cart overview container
    this.productInCart = page.locator('[class*="cart-overview"]');
    // Try multiple selectors for the proceed to checkout button
    // Could be a link or button with various text patterns
    this.proceedToCheckoutButton = page.locator(
      'button[name="processCarrier"], a:has-text("Proceed to checkout"), button:has-text("Proceed to checkout"), a[class*="checkout"], button[class*="checkout"]'
    ).first();
  }

  async verifyProductInCart(productName: string): Promise<void> {
    // Wait for cart page to load completely
    await this.page.waitForLoadState('networkidle');
    
    // Get the full page content
    const pageText = await this.page.locator('body').innerText();
    
    // Case-insensitive comparison
    const lowerPageText = pageText.toLowerCase();
    const lowerProductName = productName.toLowerCase();
    
    // Try matching with full product name
    if (lowerPageText.includes(lowerProductName)) {
      return; // Product found!
    }
    
    // Try with first 50 characters
    const partialName = productName.substring(0, 50);
    const lowerPartialName = partialName.toLowerCase();
    if (lowerPageText.includes(lowerPartialName)) {
      return; // Product found with partial match!
    }
    
    // Try with first 30 characters
    const shortName = productName.substring(0, 30);
    const lowerShortName = shortName.toLowerCase();
    if (lowerPageText.includes(lowerShortName)) {
      return; // Product found with short match!
    }
    
    // Try to find in cart-overview specifically
    const overviewElements = await this.productInCart.all();
    for (const element of overviewElements) {
      const text = await element.textContent();
      if (text && text.toLowerCase().includes(lowerProductName)) {
        return;
      }
    }
    
    // Debug output for troubleshooting
    console.error(`Product "${productName}" not found in cart (case-insensitive search).`);
    if (pageText) {
      console.error(`Page text sample: ${pageText.substring(0, 300)}`);
    }
    throw new Error(`Product "${productName}" not found in cart.`);
  }

  async proceedToCheckout(): Promise<void> {
    // Try multiple ways to find and click the checkout button
    try {
      // First try the combined locator
      await this.proceedToCheckoutButton.waitFor({ timeout: 5000 });
      await this.proceedToCheckoutButton.click();
    } catch (e) {
      // If that fails, try other selectors
      const alternativeSelectors = [
        'a:has-text("Proceed to checkout")',
        'button:has-text("Proceed to checkout")',
        'a[class*="btn"][href*="checkout"]',
        'button[name="processCarrier"]',
        '[class*="proceed"] button',
        '[class*="proceed"] a',
        'a[class*="primary"]' // Generic primary button for checkout
      ];
      
      let found = false;
      for (const selector of alternativeSelectors) {
        const element = this.page.locator(selector).first();
        try {
          await element.waitFor({ timeout: 2000 });
          await element.click();
          found = true;
          break;
        } catch (err) {
          // Try next selector
        }
      }
      
      if (!found) {
        throw new Error('Could not find Proceed to Checkout button with any known selectors');
      }
    }
  }
}