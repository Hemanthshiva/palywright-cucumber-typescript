import { User } from '../types/user';

export class TestContext {
  public registeredEmail = '';
  public registeredPassword = '';
  public selectedProductName = '';
  public orderNumber = '';
  public registeredUser: User | null = null;
  public expectingError = false;
  public registrationAttempted = false;
  public checkoutAttempted = false;
  public wishlistName = '';
  public duplicateCreated = false;
  public firstWishlistCreated = false;
  public beforeFavoritingUrl = '';
}