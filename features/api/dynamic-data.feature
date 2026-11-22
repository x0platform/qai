@api @integration
Feature: Dynamic Data with Shared Cookie Context
  As a QA engineer
  I want to pass user cookies across scenarios with dynamic data sets
  So that I can validate authenticated API flows in BDD

  @S13TC000
  Scenario: Authenticate and establish shared cookie context
    Given I authenticate via API with username "alice" and password "password123"
    Then the response status should be "200"

  @S13TC001
  Scenario Outline: User flow with shared cookie context across 3 data sets
    Given the shared context holds cookies from prior scenario
    When I call "<endpoint>" with payload '<payload>'
    Then the response status should be "<status>"

    Examples:
      | endpoint      | payload          | status |
      | /api/users/1  | {"name":"Alice"} | 200    |
      | /api/users/2  | {"name":"Bob"}   | 200    |
      | /api/users/3  | {"name":"Carol"} | 200    |
