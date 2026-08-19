Feature: API error handling
  As a service integrating with the API gateway
  I want failures returned in one predictable envelope
  So that clients can react to the code instead of parsing prose

@api @errors
  Scenario Outline: Reading <description> returns a 404
    When I send a GET request to "<path>" with the "admin" token
    Then the response status is 404
    And the response error code is "NOT_FOUND"
    And the response error message is "<message>"
    And the response includes a request id

    Examples:
      | description       | path                          | message                             |
      | an unknown route  | /api/does-not-exist           | No route for GET /api/does-not-exist |
      | an unknown user   | /api/users/usr_does_not_exist | User not found                      |

@api @errors
  Scenario Outline: A transfer with <description> is rejected
    Given a user exists via the API
    And a second user exists via the API
    When I create a transfer via the API with "<field>" set to "<value>"
    Then the response status is <status>
    And the response error code is "<code>"
    And the response error message is "<message>"

    Examples:
      | description         | field       | value              | status | code               | message                                         |
      | an unknown recipient| recipientId | usr_does_not_exist |    404 | NOT_FOUND          | Recipient not found                             |
      | more than the balance| amount     | 5000               |    422 | INSUFFICIENT_FUNDS | Account balance is too low for this transaction |

@api @errors
  Scenario: Email already registered
    When I create a user via the API with "email" set to "alice@example.com"
    Then the response status is 409
    And the response error code is "EMAIL_ALREADY_EXISTS"
    And the response error message is "A user with that email already exists"

@api @errors
  Scenario: Malformed JSON body
    When I send a malformed JSON body to the users endpoint
    Then the response status is 400
    And the response error code is "MALFORMED_JSON"
    And the response error message is "Request body is not valid JSON"

@api @errors
  Scenario: Injected gateway failure
    Given a user exists via the API
    When I request the created user with an injected status of "503"
    Then the response status is 503
    And the response error code is "INJECTED_FAILURE"
    And the response includes a request id
