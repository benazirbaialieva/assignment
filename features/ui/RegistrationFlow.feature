Feature: Registration flow
  As a new customer of Northwind Pay
  I want to open an account
  So that I can send and receive transfers

@happyPathRegistration
  Scenario Outline: Successfully create a new "<accountType>" account
    Given I am on the registration page
    When I enter a randomly generated full name
    And I enter a randomly generated email
    And I choose "<accountType>" as the account type
    And I click the Create account button
    Then verify I am taken to the dashboard page

    Examples:
      | accountType |
      | basic       |
      | premium     |
      | business    |

@negativeRegistration
  Scenario Outline: Cannot create an account with <description>
    Given I am on the registration page
    When I enter "<fullName>" as the full name
    And I enter "<email>" as the email
    And I choose "basic" as the account type
    And I click the Create account button
    Then verify the banner "Please fix the highlighted fields." appears
    And verify I am not taken to the dashboard page

    Examples:
      | description   | fullName     | email                  |
      | empty name    |              | ada.lovelace@gmail.com |
      | empty email   | Ada Lovelace |                        |
      | invalid email | Ada Lovelace | not-an-email           |
