import { test, expect } from '@playwright/test';
import { FormPage, LeadData } from '../pages/FormPage';

const lead: LeadData = {
  name: 'ERAN E',
  email: 'EranE@walla.com',
  phone: '050-1234567',
  company: 'Acme Corp',
  website: 'https://www.acmecorp.com',
};

test('Request a call back - fill form, screenshot, submit, reach thank-you page', async ({ page }) => {
  const formPage = new FormPage(page);

  await formPage.open();

  // Fill in the lead details
  await formPage.fillDetails(lead);

  // Change Number of Employees to 51-500
  await formPage.selectEmployees('51-500');
  await expect(formPage.employeesSelect).toHaveValue('51-500');

  await formPage.screenshot('screenshots/before-submit.png');

  await formPage.submit();

  // Verify the thank-you page
  await expect(page).toHaveURL(/thank-you/);
  await expect(formPage.thankYouHeading).toBeVisible();
  console.log(`Reached the thank you page: ${page.url()}`);
});
