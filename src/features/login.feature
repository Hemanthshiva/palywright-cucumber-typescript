Feature: End-to-End E-commerce Flow


  @login
  Scenario: User Login
    Given I have a registered user
    When I navigate to the sign in page
    And I login with the registered user credentials
    Then I should be logged in successfully
    And the username should be displayed on the home page

  @login @negative
  Scenario: Login fails with incorrect password
    Given I have a registered user
    When I navigate to the sign in page
    And I login with the registered user email and incorrect password
    Then I should see an error message about invalid credentials

  @login @negative
  Scenario: Login fails with non-existent email
    When I navigate to the sign in page
    And I login with a non-existent email and password
    Then I should see an error message about invalid credentials
