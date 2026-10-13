import { Page, Locator } from '@playwright/test';

export interface LeadData {
  name: string;
  email: string;
  phone: string;
  company: string;
  website: string;
}

/** Page Object for the landing-page "Request a call back" form. */
export class FormPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly companyInput: Locator;
  readonly websiteInput: Locator;
  readonly employeesSelect: Locator;
  readonly submitButton: Locator;
  readonly thankYouHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByLabel('Name');
    this.emailInput = page.getByLabel('Email');
    this.phoneInput = page.getByLabel('Phone');
    this.companyInput = page.getByLabel('Company');
    this.websiteInput = page.getByLabel('Website');
    this.employeesSelect = page.getByRole('combobox', { name: 'Number of Employees' });
    this.submitButton = page.getByRole('button', { name: 'Request a call back' });
    this.thankYouHeading = page.getByRole('heading', { name: 'Thank You!' });
  }

  async open() {
    await this.page.goto('/');
  }

  async fillDetails(data: LeadData) {
    await this.nameInput.fill(data.name);
    await this.emailInput.fill(data.email);
    await this.phoneInput.fill(data.phone);
    await this.companyInput.fill(data.company);
    await this.websiteInput.fill(data.website);
  }

  async selectEmployees(label: string) {
    await this.employeesSelect.selectOption({ label });
  }

  async screenshot(path: string) {
    await this.page.screenshot({ path, fullPage: true });
  }

  async submit() {
    await this.submitButton.click();
  }
}
