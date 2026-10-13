# Jones Automation Exercise

Playwright (TypeScript) automation + written QA answers.

## Structure
- `tests/callback-form.spec.ts` - the test flow
- `pages/FormPage.ts` - Page Object (locators + actions)
- `playwright.config.ts` - config (baseURL, reporter)
- `ANSWERS.md` - answers to questions a, b, c
- `screenshots/` - screenshot taken before clicking "Request a call back"

## Setup
1. Install Node.js (LTS): https://nodejs.org/en/download/
2. In this folder run:
   ```
   npm install
   npx playwright install chromium
   ```

## Run
```
npx playwright test --headed     # visible browser
npx playwright test              # headless
npx playwright show-report       # HTML report
```
