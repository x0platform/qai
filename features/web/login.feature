@web @smoke
Feature: User Login
  As a user
  I want to log in to the application
  So that I can access the dashboard

  @S01TC001
  Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter valid credentials
    Then I should be redirected to the dashboard
    And the welcome text should be visible
