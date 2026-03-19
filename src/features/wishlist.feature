Feature: End-to-End E-commerce Flow

  @wishlist
  Scenario: Wishlist Management
    Given I am logged in
    When I navigate to the ART category
    And I favorite a random item
    Then the wishlists popup should appear
    When I create a new wishlist
    And I add the item to the new wishlist
    Then the product added toast should be displayed

  @wishlist @negative
  Scenario: User cannot add item to wishlist without being logged in
    Given I am on the home page
    When I navigate to the ART category without logging in
    And I try to favorite an item without authentication
    Then I should be redirected to the login page

  @wishlist @negative
  Scenario: Creating duplicate wishlist fails with error
    Given I am logged in
    When I navigate to the ART category
    And I favorite a random item
    And the wishlists popup should appear
    When I create a new wishlist with a specific name
    And I try to create another wishlist with the same name
    Then I should see a duplicate wishlist error message