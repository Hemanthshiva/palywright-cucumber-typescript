Feature: End-to-End E-commerce Flow

  @e2e
  Scenario: A new user can register, login, and purchase a product
    Given I am on the registration page
    When I register a new user
    Then I should be logged in successfully
    When I login with the newly registered user's credentials
    Then I should be logged in successfully
    When I navigate to the 'ART' category
    And I select a random product
    And I add the product to the cart
    Then I should see the product in the cart
    When I proceed to checkout
    And I complete the checkout
    Then I should see an order confirmation

  @e2e @negative
  Scenario: User cannot proceed to checkout with empty cart
    Given I am logged in
    When I navigate to the cart page
    Then the cart should be empty
    And I should not be able to proceed to checkout

  @e2e @negative
  Scenario: Checkout fails when required fields are not filled
    Given I am logged in
    When I navigate to the 'ART' category
    And I select a random product
    And I add the product to the cart
    And I proceed to checkout without filling required fields
    Then I should see validation errors on the checkout page

