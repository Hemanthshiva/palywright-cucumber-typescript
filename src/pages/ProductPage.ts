import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductPage extends BasePage {
  private readonly addToCartButton: Locator;
  private readonly continueButton: Locator;
  private readonly modal: Locator;

  constructor(page: Page) {
    super(page);
    // Using getByRole for semantic button identification
    this.addToCartButton = page.getByRole('button', { name: /add to cart/i });
    // Button to continue after adding to cart (modal close)
    this.continueButton = page.getByRole('button', { name: /continue shopping/i });
    // Modal that may appear after adding to cart
    this.modal = page.locator('[class*="modal"]');
  }

  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
    
    // Wait for modal to appear and handle it
    try {
      const modal = this.page.locator('#blockcart-modal, [class*="modal"][class*="show"]').first();
      await modal.waitFor({ state: 'visible', timeout: 3000 });
      
      // Look for "Continue shopping" button in the modal
      const continueBtn = this.page.locator('#blockcart-modal button:has-text("Continue"), #blockcart-modal a:has-text("Continue")').first();
      const continueBtnExists = await continueBtn.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (continueBtnExists) {
        // Click Continue Shopping to dismiss and keep the product in cart
        await continueBtn.click();
      } else {
        // Try close button
        const closeBtn = this.page.locator(
          '#blockcart-modal .btn-close, ' +
          '#blockcart-modal button[class*="close"], ' +
          '#blockcart-modal button:has-text("×")'
        ).first();
        
        const closeExists = await closeBtn.isVisible({ timeout: 1500 }).catch(() => false);
        if (closeExists) {
          await closeBtn.click();
        } else {
          // Press Escape
          await this.page.keyboard.press('Escape');
        }
      }
      
      // Wait for modal to disappear
      await modal.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    } catch (e) {
      // No modal or already handled - continue
    }
    
    // Final wait for page to settle
    await this.page.waitForLoadState('networkidle');
  }
}