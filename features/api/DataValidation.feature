Feature: API data validation
  As a service integrating with the API gateway
  I want invalid payloads rejected with field-level detail
  So that bad data never reaches the account records

@api @validation
  Scenario Outline: Reject a user payload with <description>
    When I create a user via the API with "<field>" set to "<value>"
    Then the response status is 400
    And the response error code is "VALIDATION_ERROR"
    And the response error message is "Request body failed validation"
    And the response field error for "<field>" is "<message>"

    Examples:
      | description         | field       | value        | message                                              |
      | a missing name      | name        | (omitted)    | name is required                                     |
      | a blank name        | name        | (empty)      | name is required                                     |
      | a one-letter name   | name        | A            | name must be at least 2 characters                   |
      | a missing email     | email       | (omitted)    | email is required                                    |
      | an invalid email    | email       | not-an-email | email must be a valid email address                  |
      | an unknown type     | accountType | gold         | accountType must be one of: basic, premium, business |

@api @validation
  Scenario Outline: Reject a transaction payload with <description>
    Given a user exists via the API
    And a second user exists via the API
    When I create a transfer via the API with "<field>" set to "<value>"
    Then the response status is 400
    And the response error code is "VALIDATION_ERROR"
    And the response field error for "<field>" is "<message>"

    Examples:
      | description               | field       | value     | message                                            |
      | a missing user id         | userId      | (empty)   | userId is required                                 |
      | a missing amount          | amount      | (omitted) | amount is required                                 |
      | a non-numeric amount      | amount      | abc       | amount must be a number                            |
      | a negative amount         | amount      | -5        | amount must be greater than 0                      |
      | a zero amount             | amount      | 0         | amount must be greater than 0                      |
      | sub-cent precision        | amount      | 10.005    | amount must have at most 2 decimal places          |
      | an unknown type           | type        | crypto    | type must be one of: transfer, deposit, withdrawal |
      | a missing recipient       | recipientId | (omitted) | recipientId is required for transfers              |
      | the sender as recipient   | recipientId | (self)    | recipientId must differ from userId                |
