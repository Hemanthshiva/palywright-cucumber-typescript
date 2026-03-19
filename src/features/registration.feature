Feature: End-to-End E-commerce Flow

  

  @registration
  Scenario: User Registration
    Given I am on the home page
    When I click on the sign in link
    When I register a new user
    Then I should be logged in successfully
    And the user details should be saved to "registeredUser.json"

  @registration @negative
  Scenario: Registration fails with invalid email format
    Given I am on the registration page
    When I try to register with an invalid email format
    Then I should see an email validation error

  @registration @negative
  Scenario: Registration fails with password too short
    Given I am on the registration page
    When I try to register with a password that is too short
    Then I should see a password validation error  
