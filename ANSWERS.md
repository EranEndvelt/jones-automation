# Jones Automation Exercise - Answers

## How to run the automation
```
npm install
npx playwright install chromium
npx playwright test --headed
```
Output: `screenshots/before-submit.png`, a `console.log` line when the thank-you page is reached, and an HTML report (`npx playwright show-report`).

---

## a. Problems found in the billing widget
Static review of the UI mock-up. Each item starts with what is visible in the design; anything that depends on backend behavior and cannot be confirmed from the image is marked **Risk to verify**. Items are ordered by severity within each category, with a severity label: **[Critical]**, **[High]**, **[Medium]**, **[Low]**.

### Security
1. **[Critical] Card number is a plain text field** - the design shows a regular input with a "no dashes or spaces" hint, not a payment-provider field. **Risk to verify:** if it is a regular input on the merchant's page (not a PCI-compliant hosted iframe), raw card data reaches the company's page and servers. The company then becomes responsible for card-security compliance (PCI), and the risk of leaks grows (logs, cache, autofill).
2. **[Critical] No CVV / security code field** - weakens fraud protection; card-not-present transactions usually require CVV.
3. **[High] No CAPTCHA or other anti-bot element on the form.** **Risk to verify:** rate limiting / card-testing protection on the server - without it, attackers can use the form to test stolen card numbers.

### Functional
4. **[High] Payment amount "30.00" has no currency** - for a global company this is a critical ambiguity (USD? EUR? ILS?). No description of what is being paid for, billing period or tax/VAT.
5. **[High] Card type is a manual dropdown, separate from the card number** - the user can select VISA and enter a Mastercard number. The user is told "no dashes or spaces" instead of the system stripping them. **Validation rules required:** auto-detect card type from the first digits, check the number's length and checksum (Luhn - the standard check that catches mistyped card numbers).
6. **[High] No Country field, and "State or Province" is mandatory** - many countries have no states, and "postal code, no dashes" is US-centric (breaks UK `SW1A 1AA`, Canada `K1A 0B1`, etc.).
7. **[High] Missing UI states for payment failures** - nothing in the design for declined card, insufficient funds or gateway down. **Risk to verify:** timeout handling - if the gateway is slow or does not respond, the user should get a clear message and not be left unsure whether they were charged.
8. **[Medium] Risk to verify: past expiration dates are blocked** - Month and Year are two independent dropdowns, so the system must reject a past date (e.g., current year with an earlier month). The design also does not define how many years ahead the Year list offers.
9. **[Medium] "Continue" is ambiguous** - it is unclear whether clicking it charges the card or leads to a review step. A payment action should be explicit (e.g., "Pay 30.00 USD") or followed by a clear review screen.
10. **[Medium] "Cancel" has no defined behavior** - no confirmation before discarding the entered data, and it is unclear where the user is taken.

### Usability / Accessibility
11. **[Medium] Required-field indicators are unclear, and there are no inline error messages:**
    - **Color only** - required fields are marked only with a red asterisk, which fails accessibility.
    - **Asterisk placement** - asterisks sit *after* the input boxes instead of next to the field labels, which is ambiguous in rows with several fields.
    - **Expiration** - the only asterisk is after "Year", which suggests "Month" may be optional, although both are required.
    - **Address line 2** - the second street address input has no label and no asterisk; it should be labeled "Address line 2 (optional)".
    - **Name layout** - "Cardholder Name" is a group label above three inputs, while the asterisks are on the individual boxes, so the visual hierarchy is inconsistent.
    - **No feedback** - "Continue" looks active while required fields are empty, and the design shows no feedback for what happens on click.
12. **[Medium] Cardholder name is split into First Name / MI / Last Name** - this split is US-centric and confusing for international users who have no middle initial, a single name, or several surnames, and "MI" is an unclear abbreviation. The card itself shows one name string, so a single **"Name on Card"** field is simpler and works globally.
13. **[Medium] Confusing layout** - "Payment Amount" and "Expiration" sit in the right column next to unrelated fields, so tab order and reading flow are unclear. No mobile layout is shown; **risk to verify:** the two-column layout on small screens.
14. **[Low] Screen title does not match the content** - "Account Information" does not describe a payment screen (e.g., "Payment Details").
15. **[Low] Low contrast and tiny hint text** (e.g., "* indicates required information", light-grey borders) - likely below basic accessibility guidelines (WCAG); verify with a contrast checker.

### Performance / Reliability
16. **[High] Missing loading / disabled state for "Continue"** - the design shows no feedback while the payment is processed, so on a slow gateway the user may click again. **Risk to verify:** double charge - the server should ignore a duplicate payment request.

---

## b. Sample test cases
Test environment: payment gateway in sandbox / test mode, using the provider's public test card numbers.

### TC-01 - Successful payment with valid data (Happy path)
| | |
|---|---|
| **Preconditions** | User is logged in and on the Account Information screen; gateway in sandbox mode |
| **Steps** | 1. Select Card Type = VISA<br>2. Enter test card number `4111111111111111`<br>3. Select expiration Month/Year in the future<br>4. Enter First Name, Last Name<br>5. Enter street address, city, select state, enter postal code<br>6. Click **Continue** (and complete the confirmation step, if one exists) |
| **Expected result** | Data passes validation, **Continue** shows a loading state and ignores a second click, user proceeds to the next/confirmation step. When the payment is completed, 30.00 is charged **once** and a receipt is generated. |

### TC-02 - Required-field validation
| | |
|---|---|
| **Preconditions** | User is on the Account Information screen with an empty form |
| **Steps** | Leave all fields empty and click **Continue** |
| **Expected result** | Form is not submitted. An error message appears next to each required field (Card Number, Expiration, First Name, Last Name, Address, City, State, Postal Code), focus moves to the first invalid field, and no request is sent to the payment gateway. |

### TC-03 - Invalid card number and card-type mismatch
| | |
|---|---|
| **Preconditions** | User is on the Account Information screen; all other fields filled with valid data |
| **Steps** | 1. Select VISA<br>2. Enter `1234567890123456` (correct length, but not a valid card number - fails the Luhn check), then click Continue<br>3. Enter a valid Mastercard test number `5555555555554444` while VISA is selected, then click Continue<br>4. Enter letters / dashes / spaces in the card number field |
| **Expected result** | Step 2: error "Invalid card number". Step 3: error or auto-correction of the card type. Step 4: letters are rejected, and spaces/dashes are either stripped or a clear message is shown. No request is sent to the gateway for invalid data. |

---

## c. Product solution for the most severe bug

**Most severe issue: the card number is collected in a plain input field on the merchant's page, with no CVV, no card-number validation and a manual card type (Security + Functional).**
This is the most severe because it combines financial-fraud risk, card-security compliance (PCI) risk and failed/incorrect payments for a global company.

**Proposed solution:**
1. **Use hosted payment fields (iframe) from a PCI-compliant provider** (e.g., Stripe Elements, Braintree, Adyen) so raw card data never touches the company's servers. The provider then handles most of the card-security compliance (PCI).
2. **Add a mandatory CVV/CVC field.**
3. **Auto-detect the card type** as the user types (showing the brand logo) and remove the manual dropdown. Validate the card length and checksum (Luhn) on the fly.
4. **Auto-format the card number** - strip spaces and dashes automatically instead of asking the user to avoid them.
5. **Prevent duplicate charges and abuse:** disable "Continue" right after the first click, reject duplicate payment requests on the server, and limit repeated failed attempts.

**Related improvements:** add a Country selector that adapts the State/Province and Postal Code rules, show the currency next to the amount, and replace First Name / MI / Last Name with a single "Name on Card" field.
