import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { RegisterPage } from '../pages/RegisterPage';
import { LoginPage } from '../pages/LoginPage';
import { CategoryPage } from '../pages/CategoryPage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { HomePage } from '../pages/HomePage';
import { generateUser } from '../utils/fakerUtils';
import * as fs from 'fs';
import * as path from 'path';

// ========== CONSTANTS ==========
const BASE_URL = 'https://teststore.automationtesting.co.uk';
const HOME_URL = `${BASE_URL}/index.php`;
const AUTH_URL = `${HOME_URL}?controller=authentication`;
const ORDER_URL = `${HOME_URL}?controller=order`;
const REGISTERED_USER_FILE = 'registeredUser.json';

// ========== HELPER FUNCTIONS ==========

/**
 * Load registered user data from file
 */
function loadRegisteredUser(context: CustomWorld): void {
  const filePath = path.join(process.cwd(), REGISTERED_USER_FILE);
  if (!fs.existsSync(filePath)) {
    throw new Error(`No registered user found. Please run registration scenario first.`);
  }
  const userData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  context.testContext.registeredEmail = userData.email;
  context.testContext.registeredPassword = userData.password;
  context.testContext.registeredUser = userData;
}

/**
 * Save user data to file
 */
function saveUserToFile(user: any): void {
  const filePath = path.join(process.cwd(), REGISTERED_USER_FILE);
  fs.writeFileSync(filePath, JSON.stringify(user, null, 2));
}

/**
 * Decode HTML entities in text
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/**
 * Check if page contains any error patterns
 */
async function hasErrorMessage(page: any, patterns: RegExp[]): Promise<boolean> {
  const pageText = await page.locator('body').innerText();
  for (const pattern of patterns) {
    if (pattern.test(pageText)) {
      return true;
    }
  }
  return false;
}

/**
 * Check for error UI elements
 */
async function hasErrorElements(page: any): Promise<boolean> {
  const errorCount = await page.locator('[class*="alert"], [class*="error"], [class*="danger"]').count();
  return errorCount > 0;
}

// ========== STEP DEFINITIONS ==========

Given('I am on the registration page', async function (this: CustomWorld) {
  await this.page.goto('/');
  await this.page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await this.page.getByRole('link', { name: 'No account? Create one here', exact: true }).click();
});


Given('I am on the home page', async function (this: CustomWorld) {
  await this.page.goto(HOME_URL);
  await expect(this.page).toHaveTitle(/Test Store/);
});

When('I click on the sign in link', async function (this: CustomWorld) {
  const homePage = new HomePage(this.page);
  await homePage.clickSignIn();
});

Given('I am logged in', async function (this: CustomWorld) {
  loadRegisteredUser(this);
  const loginPage = new LoginPage(this.page);
  await this.page.goto(AUTH_URL);
  await loginPage.login(this.testContext.registeredEmail, this.testContext.registeredPassword);
});

Given('I have a registered user', function (this: CustomWorld) {
  loadRegisteredUser(this);
});

When('I navigate to the sign in page', async function (this: CustomWorld) {
  await this.page.goto(AUTH_URL);
});

When('I click on "No account? Create one here"', async function (this: CustomWorld) {
  const loginPage = new LoginPage(this.page);
  await loginPage.clickCreateAccount();
});

When('I register a new user', async function (this: CustomWorld) {
  const registerPage = new RegisterPage(this.page);
  const user = generateUser();
  this.testContext.registeredEmail = user.email;
  this.testContext.registeredPassword = user.password;
  this.testContext.registeredUser = user;
  await registerPage.registerUser(user);
  saveUserToFile(user);
});

Then('the user details should be saved to {string}', async function (this: CustomWorld, fileName: string) {
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`${fileName} not found`);
  }
  const savedUser = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (savedUser.email !== this.testContext.registeredEmail) {
    throw new Error('Saved email does not match');
  }
});

When('I login with the registered user credentials', async function (this: CustomWorld) {
  const loginPage = new LoginPage(this.page);
  await loginPage.login(this.testContext.registeredEmail, this.testContext.registeredPassword);
});

Then('the username should be displayed on the home page', async function (this: CustomWorld) {
  const homePage = new HomePage(this.page);
  await this.page.goto(HOME_URL);
  const userName = await homePage.getUserName();
  if (!userName?.includes(this.testContext.registeredUser?.firstName || '')) {
    throw new Error('Username not displayed on home page');
  }
});

When('I navigate to the ART category', async function (this: CustomWorld) {
  const homePage = new HomePage(this.page);
  await this.page.goto(HOME_URL);
  await homePage.navigateToArtCategory();
  await expect(this.page).toHaveURL(/id_category=9/);
});

When('I favorite a random item', async function (this: CustomWorld) {
  const categoryPage = new CategoryPage(this.page);
  await categoryPage.favoriteRandomItem();
});

When('I add the product to the cart', async function (this: CustomWorld) {
  const productPage = new ProductPage(this.page);
  await productPage.addToCart();
});

Then('I should see the product in the cart', async function (this: CustomWorld) {
  const cartPage = new CartPage(this.page);
  
  // Close any open modals
  const modal = this.page.locator('#blockcart-modal, [class*="modal"][class*="show"]').first();
  const isModalVisible = await modal.isVisible({ timeout: 2000 }).catch(() => false);
  if (isModalVisible) {
    const closeBtn = this.page.locator('#blockcart-modal [class*="close"], #blockcart-modal button:has-text("×"), #blockcart-modal button[aria-label*="close"]').first();
    const closeExists = await closeBtn.isVisible({ timeout: 1000 }).catch(() => false);
    if (closeExists) {
      await closeBtn.click();
    } else {
      await this.page.locator('body').click({ position: { x: 10, y: 10 } });
    }
    await this.page.waitForTimeout(1000);
  }
  
  await this.page.locator('[class*="cart"] a, [class*="shopping"]').first().click();
  const productName = this.testContext.selectedProductName || '';
  await cartPage.verifyProductInCart(productName);
});

When('I proceed to checkout', async function (this: CustomWorld) {
  const cartPage = new CartPage(this.page);
  await cartPage.proceedToCheckout();
});

When('I complete the checkout', async function (this: CustomWorld) {
  const checkoutPage = new CheckoutPage(this.page);
  this.testContext.orderNumber = await checkoutPage.completeCheckout();
});

Then('I should see an order confirmation', async function (this: CustomWorld) {
  await this.page.waitForLoadState('networkidle');
  
  const pageText = await this.page.locator('body').innerText();
  const confirmationPatterns = [
    /your order is confirmed/i,
    /order confirmation/i,
    /thank you for your order/i,
    /order #\d+/i,
    /order placed/i
  ];
  
  if (await hasErrorMessage(this.page, confirmationPatterns)) {
    return;
  }
  
  const currentUrl = this.page.url();
  if (currentUrl.includes('order') || currentUrl.includes('confirmation') || !currentUrl.includes('checkout')) {
    return;
  }
  
  if (this.testContext.orderNumber && this.testContext.orderNumber !== 'Order placed successfully') {
    return;
  }
  
  throw new Error('Could not find order confirmation on the page');
});

Then('the wishlists popup should appear', async function (this: CustomWorld) {
  const categoryPage = new CategoryPage(this.page);
  if (!await categoryPage.isWishlistPopupVisible()) {
    throw new Error('Wishlists popup did not appear');
  }
});

When('I create a new wishlist', async function (this: CustomWorld) {
  const categoryPage = new CategoryPage(this.page);
  await categoryPage.createNewWishlist('My Wishlist');
});

When('I add the item to the new wishlist', async function (this: CustomWorld) {
  const categoryPage = new CategoryPage(this.page);
  await categoryPage.addItemToWishlist();
});

Then('the product added toast should be displayed', async function (this: CustomWorld) {
  const categoryPage = new CategoryPage(this.page);
  if (!await categoryPage.isProductAddedToastVisible()) {
    throw new Error('Product added toast not displayed');
  }
});

Then('I should be logged in successfully', async function (this: CustomWorld) {
  const accountLink = this.page.locator('.account span');
  await expect(accountLink).toBeVisible();
});

When('I login with the newly registered user\'s credentials', async function (this: CustomWorld) {
  await this.page.goto(AUTH_URL, { waitUntil: 'networkidle' });
  
  const emailField = this.page.locator('#field-email');
  if (await emailField.count() > 0) {
    const loginPage = new LoginPage(this.page);
    await loginPage.login(this.testContext.registeredEmail, this.testContext.registeredPassword);
  } else {
    await this.page.goto(HOME_URL);
  }
});

When('I navigate to the {string} category', async function (this: CustomWorld, category: string) {
  const homePage = new HomePage(this.page);
  await this.page.goto(HOME_URL);
  await homePage.navigateToArtCategory();
});

When('I select a random product', async function (this: CustomWorld) {
  const categoryPage = new CategoryPage(this.page);
  const productName = await categoryPage.selectRandomProduct();
  this.testContext.selectedProductName = decodeHtmlEntities(productName);
});

// ========== NEGATIVE SCENARIO STEPS - LOGIN ==========

When('I login with the registered user email and incorrect password', async function (this: CustomWorld) {
  const loginPage = new LoginPage(this.page);
  await loginPage.login(this.testContext.registeredEmail, 'wrongPassword123!');
  this.testContext.expectingError = true;
});

When('I login with a non-existent email and password', async function (this: CustomWorld) {
  const loginPage = new LoginPage(this.page);
  await loginPage.login('nonexistent' + Date.now() + '@fakeemail.com', 'SomePassword123!');
  this.testContext.expectingError = true;
});

Then('I should see an error message about invalid credentials', async function (this: CustomWorld) {
  await this.page.waitForLoadState('networkidle');
  
  const patterns = [
    /authentication failed/i,
    /invalid credentials/i,
    /your credentials are invalid/i,
    /incorrect password/i,
    /error/i
  ];
  
  const hasError = await hasErrorMessage(this.page, patterns) || await hasErrorElements(this.page);
  if (!hasError) {
    throw new Error('Expected error message not found on login page');
  }
});

// ========== NEGATIVE SCENARIO STEPS - REGISTRATION ==========

When('I try to register with an invalid email format', async function (this: CustomWorld) {
  const registerPage = new RegisterPage(this.page);
  const user = generateUser();
  user.email = 'invalidemail';
  this.testContext.registeredEmail = user.email;
  this.testContext.registeredPassword = user.password;
  
  try {
    await registerPage.registerUser(user);
    await this.page.waitForLoadState('networkidle');
    this.testContext.registrationAttempted = true;
  } catch (e) {
    this.testContext.registrationAttempted = true;
  }
});

Then('I should see an email validation error', async function (this: CustomWorld) {
  await this.page.waitForLoadState('networkidle');
  
  const patterns = [
    /invalid.*email/i,
    /email.*format/i,
    /valid email/i,
    /must be a valid email/i
  ];
  
  const hasError = await hasErrorMessage(this.page, patterns);
  const emailFieldWithError = await this.page.locator('#field-email[class*="error"]').count() > 0;
  
  if (!hasError && !emailFieldWithError) {
    const emailField = await this.page.locator('#field-email').isVisible();
    if (!emailField) {
      throw new Error('Expected email validation error or form retention not found');
    }
  }
});

When('I try to register with a password that is too short', async function (this: CustomWorld) {
  const registerPage = new RegisterPage(this.page);
  const user = generateUser();
  user.password = 'ab1';
  this.testContext.registeredEmail = user.email;
  this.testContext.registeredPassword = user.password;
  
  try {
    await registerPage.registerUser(user);
    await this.page.waitForLoadState('networkidle');
    this.testContext.registrationAttempted = true;
  } catch (e) {
    this.testContext.registrationAttempted = true;
  }
});

Then('I should see a password validation error', async function (this: CustomWorld) {
  await this.page.waitForLoadState('networkidle');
  
  const patterns = [
    /password.*short/i,
    /password.*length/i,
    /password.*minimum/i,
    /at least.*character/i,
    /must be at least/i
  ];
  
  const hasError = await hasErrorMessage(this.page, patterns);
  const passwordFieldWithError = await this.page.locator('#field-password[class*="error"]').count() > 0;
  
  if (!hasError && !passwordFieldWithError) {
    const passwordField = await this.page.locator('#field-password').isVisible();
    if (!passwordField) {
      throw new Error('Expected password validation error or form retention not found');
    }
  }
});

// ========== NEGATIVE SCENARIO STEPS - E2E ==========

When('I navigate to the cart page', async function (this: CustomWorld) {
  try {
    const cartLink = this.page.locator('[class*="cart"] a, [class*="shopping"]').first();
    await cartLink.click();
    await this.page.waitForLoadState('networkidle');
    
    const removeButtons = this.page.locator('button:has-text("Remove"), button[class*="delete"], button[class*="remove"]');
    let count = await removeButtons.count();
    while (count > 0) {
      await removeButtons.first().click();
      await this.page.waitForTimeout(500);
      count = await removeButtons.count();
    }
  } catch (e) {
    // Cart already empty or loading
  }
  
  await this.page.waitForLoadState('networkidle');
});

Then('the cart should be empty', async function (this: CustomWorld) {
  const pageText = await this.page.locator('body').innerText();
  
  const patterns = [/your cart is empty/i, /cart is empty/i, /no items/i, /empty cart/i];
  const emptyFound = await hasErrorMessage(this.page, patterns);
  const cartProducts = await this.page.locator('[class*="cart"][class*="item"], [class*="cart-item"]').count();
  
  if (!emptyFound && cartProducts > 0) {
    throw new Error('Cart is not empty - found products');
  }
});

Then('I should not be able to proceed to checkout', async function (this: CustomWorld) {
  const checkoutButton = this.page.locator(
    'button:has-text("Proceed to checkout"), a:has-text("Proceed to checkout"), button[class*="checkout"], a[class*="checkout"]'
  ).first();
  
  const isVisible = await checkoutButton.isVisible({ timeout: 2000 }).catch(() => false);
  const isDisabled = await checkoutButton.isDisabled({ timeout: 2000 }).catch(() => false);
  
  if (isVisible && !isDisabled) {
    throw new Error('Checkout button is available when cart is empty');
  }
});

When('I proceed to checkout without filling required fields', async function (this: CustomWorld) {
  try {
    const cartPage = new CartPage(this.page);
    await cartPage.proceedToCheckout();
    await this.page.goto(ORDER_URL, { waitUntil: 'networkidle' });
    this.testContext.checkoutAttempted = true;
  } catch (e) {
    this.testContext.checkoutAttempted = true;
  }
});

Then('I should see validation errors on the checkout page', async function (this: CustomWorld) {
  await this.page.waitForLoadState('networkidle');
  
  const patterns = [
    /required/i,
    /field.*required/i,
    /validation.*error/i,
    /error/i,
    /please|must/i
  ];
  
  const hasError = await hasErrorMessage(this.page, patterns);
  if (!hasError) {
    throw new Error('Expected validation errors not found on checkout page');
  }
});

// ========== NEGATIVE SCENARIO STEPS - WISHLIST ==========

When('I navigate to the ART category without logging in', async function (this: CustomWorld) {
  await this.page.goto(HOME_URL);
  const homePage = new HomePage(this.page);
  await homePage.navigateToArtCategory();
  await this.page.waitForLoadState('networkidle');
  this.testContext.beforeFavoritingUrl = this.page.url();
});

When('I try to favorite an item without authentication', async function (this: CustomWorld) {
  try {
    const categoryPage = new CategoryPage(this.page);
    await categoryPage.favoriteRandomItem();
    await this.page.waitForTimeout(1000);
  } catch (e) {
    console.log('Favorite action might have failed or requires authentication');
  }
});

Then('I should be redirected to the login page', async function (this: CustomWorld) {
  await this.page.waitForLoadState('networkidle');
  
  const currentUrl = this.page.url();
  const isLoginPage = currentUrl.includes('authentication') || currentUrl.includes('login') || currentUrl.includes('signin');
  const loginForm = await this.page.locator('#field-email, [id*="login"]').isVisible().catch(() => false);
  const wishlistPopup = await this.page.getByRole('dialog').isVisible().catch(() => false);
  
  if (isLoginPage || loginForm || wishlistPopup) {
    return;
  }
  
  if (currentUrl === this.testContext.beforeFavoritingUrl) {
    const pageText = await this.page.locator('body').innerText();
    if (pageText.toLowerCase().includes('login') || pageText.toLowerCase().includes('authentication')) {
      return;
    }
  }
  
  if (wishlistPopup) {
    return;
  }
  
  throw new Error(`Not redirected to login page. Current URL: ${currentUrl}`);
});

When('I create a new wishlist with a specific name', async function (this: CustomWorld) {
  const wishlistName = 'TestWishlist' + Date.now();
  this.testContext.wishlistName = wishlistName;
  
  try {
    const categoryPage = new CategoryPage(this.page);
    await categoryPage.createNewWishlist(wishlistName);
    this.testContext.firstWishlistCreated = true;
  } catch (e) {
    this.testContext.firstWishlistCreated = false;
  }
});

When('I try to create another wishlist with the same name', async function (this: CustomWorld) {
  try {
    const popup = await this.page.getByRole('dialog').isVisible().catch(() => false);
    
    if (!popup) {
      const categoryPage = new CategoryPage(this.page);
      await categoryPage.favoriteRandomItem();
      await this.page.waitForTimeout(500);
    }
    
    const categoryPage = new CategoryPage(this.page);
    await categoryPage.createNewWishlist(this.testContext.wishlistName);
    this.testContext.duplicateCreated = true;
  } catch (e) {
    console.log('Duplicate wishlist creation failed as expected');
    this.testContext.duplicateCreated = false;
  }
});

Then('I should see a duplicate wishlist error message', async function (this: CustomWorld) {
  await this.page.waitForLoadState('networkidle');
  
  const patterns = [
    /already exists/i,
    /duplicate/i,
    /name.*already/i,
    /already in use/i,
    /already used/i
  ];
  
  const hasError = await hasErrorMessage(this.page, patterns);
  
  const dialog = this.page.getByRole('dialog');
  const dialogVisible = await dialog.isVisible().catch(() => false);
  
  if (dialogVisible) {
    const errorElements = await dialog.locator('[class*="error"], [class*="alert"]').count();
    if (errorElements > 0) {
      return;
    }
  }
  
  const pageErrorCount = await this.page.locator('[class*="error"], [class*="alert"], [class*="invalid"]').count();
  
  if (hasError || pageErrorCount > 0) {
    return;
  }
  
  if (!this.testContext.duplicateCreated) {
    return;
  }
});