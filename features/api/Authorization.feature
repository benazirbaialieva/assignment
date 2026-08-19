Feature: API authentication and authorization
  As the API gateway
  I want every call authenticated and scoped to its owner
  So that no account can read or move another account's money

@api @auth
  Scenario Outline: Registration rejects <description>
    When I create a user via the API <apiKey>
    Then the response status is 401
    And the response error code is "UNAUTHORIZED"
    And the response error message is "<message>"

    Examples:
      | description   | apiKey                       | message                  |
      | a missing key | without an API key           | Missing x-api-key header |
      | a wrong key   | with API key "nope-not-mine" | Invalid API key          |

@api @auth
  Scenario Outline: Reading <path> with <description> is rejected
    When I send a GET request to "<path>" with the "<token>" token
    Then the response status is <status>
    And the response error code is "<code>"
    And the response error message is "<message>"

    Examples:
      | description          | path                              | token           | status | code         | message                                |
      | no token             | /api/users/usr_seed_alice         | none            |    401 | UNAUTHORIZED | Missing bearer token                   |
      | an unknown token     | /api/users/usr_seed_alice         | invalid         |    401 | UNAUTHORIZED | Invalid or expired token               |
      | a frozen account     | /api/users/usr_seed_frozen        | tok_seed_frozen |    403 | FORBIDDEN    | Account is not active                  |
      | another user's token | /api/users/usr_seed_alice         | tok_seed_bob    |    403 | FORBIDDEN    | You may only access your own resources |
      | another user's token | /api/transactions/usr_seed_alice  | tok_seed_bob    |    403 | FORBIDDEN    | You may only access your own resources |
      | another user's token | /api/notifications/usr_seed_alice | tok_seed_bob    |    403 | FORBIDDEN    | You may only access your own resources |

@api @auth
  Scenario Outline: An admin token can read <path>
    When I send a GET request to "<path>" with the "admin" token
    Then the response status is 200

    Examples:
      | path                              |
      | /api/users/usr_seed_alice         |
      | /api/transactions/usr_seed_alice  |
      | /api/notifications/usr_seed_alice |

@api @auth
  Scenario: A user cannot create a transaction on another account
    Given a user exists via the API
    And a second user exists via the API
    When I create a transaction for user "second user" with the "user" token
    Then the response status is 403
    And the response error code is "FORBIDDEN"
    And the response error message is "You may only create transactions for your own account"

@api @auth
  Scenario: A user cannot delete another user
    Given a user exists via the API
    And a second user exists via the API
    When I delete the created user with the "second user" token
    Then the response status is 403
    And the response error message is "You may only access your own resources"
