Feature: Transaction creation
  As a signed-in Northwind Pay customer
  I want to send transfers, deposits and withdrawals
  So that I can move money in and out of my account

Background: Precondition for transactions
  Given a recipient account exists
  And I am registered and signed in on the dashboard

@successfulTransaction
  Scenario Outline: Successfully create a <type> transaction
    When I select "<type>" as the transaction type
    And I enter "<amount>" as the transaction amount
    And I enter the recipient account id for transfers
    And I submit the transaction
    Then verify the transaction is created successfully
    And verify available balance is "<expectedBalance>"

    Examples:
      | type       | amount | expectedBalance |
      | transfer   | 100.00 | $900.00         |
      | deposit    | 250.00 | $1,250.00       |
      | withdrawal | 50.00  | $950.00         |

@failedTransaction
  Scenario Outline: Cannot create a transaction with <description>
    When I select "transfer" as the transaction type
    And I enter "<amount>" as the transaction amount
    And I enter "<recipient>" as the recipient account id
    And I submit the transaction
    Then verify the error "<message>" is displayed
    And verify the transaction is not created

    Examples:
      | description             | amount  | recipient                | message                                         |
      | an amount above balance | 5000.00 | the recipient account id | Account balance is too low for this transaction |
      | an unknown recipient    | 100.00  | usr_doesnotexist         | Recipient not found                             |
      | an empty amount         |         | the recipient account id | Amount is required                              |
      | an empty recipient      | 100.00  |                          | Recipient account id is required                |
      | myself as the recipient | 100.00  | my own account id        | recipientId must differ from userId             |
