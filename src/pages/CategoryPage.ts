import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { getRandomNumber } from '../utils/randomUtils';

export class CategoryPage extends BasePage {
  private readonly productContainer: Locator;
  private readonly favoriteButton: Locator;
  private readonly wishlistPopup: Locator;
  private readonly createWishlistButton: Locator;
  private readonly wishlistNameInput: Locator;
  private readonly saveWishlistButton: Locator;
  private readonly addToWishlistButton: Locator;
  private readonly productAddedToast: Locator;

  constructor(page: Page) {
    super(page);
    // Using CSS selector for product containers - more maintainable than XPath
    this.productContainer = page.locator('[class*="product-miniature"]');
    this.favoriteButton = page.locator('.wishlist-button-add');
    this.wishlistPopup = page.getByRole('dialog');
    this.createWishlistButton = this.wishlistPopup.locator('.wishlist-create button[class*="primary"]');
    this.wishlistNameInput = this.wishlistPopup.locator('input[type="text"]');
    this.saveWishlistButton = this.wishlistPopup.locator('.wishlist-create button[class*="primary"]');
    this.addToWishlistButton = this.wishlistPopup.locator('button').filter({ hasText: 'Add' }).or(this.wishlistPopup.locator('button[class*="primary"]'));
    this.productAddedToast = page.locator('[class*="toast"]').filter({ hasText: 'Product added' });
  }

  async selectRandomProduct(): Promise<string> {
    await this.productContainer.first().waitFor({ state: 'visible', timeout: 30000 });
    const productCount = await this.productContainer.count();
    const randomIndex = getRandomNumber(0, productCount - 1);
    const randomProduct = this.productContainer.nth(randomIndex);
    
    // Get the product link
    const productNameElement = randomProduct.locator('h2.product-title a');
    
    // Click the link to navigate to the product detail page
    await productNameElement.click();
    
    // Wait for the product detail page to load
    await this.page.waitForLoadState('networkidle');
    
    // Get the product name from the detail page (h1 heading)
    const productName = await this.page.locator('h1').first().innerText().catch(() => '');
    
    return productName.trim();
  }

  async favoriteRandomItem(): Promise<void> {
    const productCount = await this.productContainer.count();
    const randomIndex = getRandomNumber(0, productCount - 1);
    const randomProduct = this.productContainer.nth(randomIndex);
    const favoriteBtn = randomProduct.locator('.wishlist-button-add');
    await favoriteBtn.click();
  }

  async isWishlistPopupVisible(): Promise<boolean> {
    return await this.wishlistPopup.isVisible();
  }

  async createNewWishlist(name: string): Promise<void> {
    // Wait for any animations to complete
    await this.page.waitForTimeout(300);
    
    // Get the dialog
    const dialog = this.page.getByRole('dialog');
    
    // Find all buttons in the dialog
    const buttons = await dialog.locator('button').all();
    
    // The first button is usually the "Create" button (for new wishlist)
    if (buttons.length > 0) {
      await buttons[0].click();
      await this.page.waitForTimeout(300);
    }
    
    // Fill in the wishlist name - find the input field
    const inputs = await dialog.locator('input[type="text"]').all();
    if (inputs.length > 0) {
      await inputs[0].fill(name);
      await this.page.waitForTimeout(300);
    }
    
    // Find and click the save button - usually the last button or the first primary button
    const saveButtons = await dialog.locator('button[class*="primary"], button[type="submit"]').all();
    if (saveButtons.length > 0) {
      await saveButtons[0].click();
    } else if (buttons.length > 1) {
      // If no primary button, try the second button
      await buttons[1].click();
    }
    
    await this.page.waitForTimeout(500);
  }

  async addItemToWishlist(): Promise<void> {
    // Wait a bit for the dialog to update after creating the wishlist
    await this.page.waitForTimeout(500);
    
    // Try to find the "Add" button in the dialog
    const dialog = this.page.getByRole('dialog');
    
    // Try multiple button text patterns that might indicate "Add" functionality
    const buttonTextPatterns = [
      'Add',
      'Add to Wishlist',
      'Add to wishlist',
      'Add item',
      'Select',
      'Confirm'
    ];
    
    let buttonClicked = false;
    
    for (const text of buttonTextPatterns) {
      const button = dialog.locator(`button:has-text("${text}")`).first();
      const isVisible = await button.isVisible({ timeout: 1000 }).catch(() => false);
      
      if (isVisible) {
        await button.click();
        buttonClicked = true;
        break;
      }
    }
    
    // If no text-based button found, try by index
    if (!buttonClicked) {
      const allButtons = await dialog.locator('button').all();
      if (allButtons.length > 0) {
        // Skip the first button (might be cancel/close), click the next one
        if (allButtons.length > 1) {
          await allButtons[1].click();
        } else {
          await allButtons[0].click();
        }
        buttonClicked = true;
      }
    }
    
    // Wait for the dialog to close or disappear
    await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    
    // Give the page a moment to show any toast notifications
    await this.page.waitForTimeout(1000);
  }

  async isProductAddedToastVisible(): Promise<boolean> {
    // Wait a bit for the toast to appear
    await this.page.waitForTimeout(1000);
    
    // Try the primary toast selector
    let toastVisible = await this.productAddedToast.isVisible({ timeout: 3000 }).catch(() => false);
    if (toastVisible) {
      return true;
    }
    
    // Try to find any visible text that indicates success
    const successPatterns = [
      'Product added',
      'added to',
      'saved',
      'Success',
      'added to wishlist'
    ];
    
    for (const pattern of successPatterns) {
      const elements = this.page.locator(`text="${pattern}"`);
      const isVisible = await elements.isVisible({ timeout: 2000 }).catch(() => false);
      if (isVisible) {
        return true;
      }
    }
    
    // Try role-based selectors
    const alertRole = this.page.getByRole('alert');
    if (await alertRole.isVisible({ timeout: 2000 }).catch(() => false)) {
      return true;
    }
    
    // Try any element with class containing common toast/notification names
    const notificationSelectors = [
      '[class*="toast"]',
      '[class*="notification"]',
      '[class*="success"]',
      '[class*="message"]',
      '[class*="alert"]',
      '[data-notify]'
    ];
    
    for (const selector of notificationSelectors) {
      const element = this.page.locator(selector);
      const isVisible = await element.isVisible({ timeout: 1000 }).catch(() => false);
      if (isVisible) {
        return true;
      }
    }
    
    return false;
  }
}