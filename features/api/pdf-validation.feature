@api @regression
Feature: PDF Upload Size Validation
  As a QA engineer
  I want to validate PDF upload size limits via API
  So that the system accepts valid files and rejects oversized files

  @S07TC001
  Scenario Outline: PDF upload size limit validation
    Given a PDF file of "<size>MB" is prepared
    When the PDF is uploaded to "<endpoint>"
    Then the response status should be "<expectedStatus>"
    And the response body should contain "<expectedMessage>"

    Examples:
      | size | endpoint    | expectedStatus | expectedMessage |
      | 2    | /api/upload | 200            | success         |
      | 2.1  | /api/upload | 413            | file too large  |
