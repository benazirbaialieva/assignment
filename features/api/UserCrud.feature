Feature: User API CRUD operations
  As a service integrating with the API gateway
  I want to create, read, update and delete users
  So that account records stay in step with the product

@api @crud
  Scenario: Create a user
    When I create a user via the API
    Then the response status is 201
    And the response field "id" starts with "usr_"
    And the response field "accountType" is "basic"
    And the response field "status" is "active"
    And the response field "balance" is "1000"
    And the response includes a token

@api @crud
  Scenario: Read a user by id
    Given a user exists via the API
    When I request the created user with the "user" token
    Then the response status is 200
    And the response field "status" is "active"
    And the response field "balance" is "1000"

@api @crud
  Scenario Outline: Update a user's <field>
    Given a user exists via the API
    When I update the created user with "<field>" set to "<value>" using the "user" token
    Then the response status is 200
    And the response field "<field>" is "<value>"

    Examples:
      | field       | value            |
      | name        | Renamed Customer |
      | accountType | premium          |

@api @crud
  Scenario: Delete a user
    Given a user exists via the API
    When I delete the created user with the "user" token
    Then the response status is 204
    When I request the created user with the "admin" token
    Then the response status is 404
    And the response error message is "User not found"

@api @crud
  Scenario: Create a transaction and read it back
    Given a user exists via the API
    When I create a "deposit" transaction of "250.00" with the "user" token
    Then the response status is 201
    And the response field "type" is "deposit"
    And the response field "status" is "completed"
    And the response field "balanceAfter" is "1250"
    When I list transactions for the created user with the "user" token
    Then the response status is 200
    And the response contains 1 transaction
