import type { Page, Locator } from '@playwright/test';

/**
 * LoginPage - Page object for the QAI Test App login page.
 *
 * Encapsulates selectors and actions for the login form at /login.
 */
export class LoginPage {
  readonly page: Page;
  readonly baseURL: string;

  // Selectors
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page, baseURL: string) {
    this.page = page;
    this.baseURL = baseURL;

    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('#error');
    this.successMessage = page.locator('#success');
  }

  /**
   * Navigate to the login page
   */
  async goto(): Promise<void> {
    await this.page.goto(`${this.baseURL}/login`);
  }

  /**
   * Fill username field
   */
  async fillUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
  }

  /**
   * Fill password field
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * Click the submit button
   */
  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Perform full login: fill credentials and submit
   */
  async login(username: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickSubmit();
  }

  /**
   * Wait for navigation to dashboard after successful login
   */
  async waitForDashboard(): Promise<void> {
    await this.page.waitForURL(`${this.baseURL}/dashboard`);
  }

  /**
   * Get error message text if visible
   */
  async getErrorMessage(): Promise<string | null> {
    if (await this.errorMessage.isVisible()) {
      return this.errorMessage.textContent();
    }
    return null;
  }

  /**
   * Check if login form is displayed
   */
  async isLoginFormVisible(): Promise<boolean> {
    const usernameVisible = await this.usernameInput.isVisible();
    const passwordVisible = await this.passwordInput.isVisible();
    return usernameVisible && passwordVisible;
  }
}

/**
 * DashboardPage - Page object for the QAI Test App dashboard.
 */
export class DashboardPage {
  readonly page: Page;
  readonly baseURL: string;

  readonly welcomeText: Locator;
  readonly logoutButton: Locator;
  readonly usernameDisplay: Locator;

  constructor(page: Page, baseURL: string) {
    this.page = page;
    this.baseURL = baseURL;

    this.welcomeText = page.locator('h1');
    this.logoutButton = page.locator('.btn-logout');
    this.usernameDisplay = page.locator('strong');
  }

  /**
   * Wait for dashboard to load
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForURL(`${this.baseURL}/dashboard`);
    await this.welcomeText.waitFor();
  }

  /**
   * Get welcome heading text
   */
  async getWelcomeHeading(): Promise<string | null> {
    return this.welcomeText.textContent();
  }

  /**
   * Click logout button
   */
  async clickLogout(): Promise<void> {
    await this.logoutButton.click();
  }

  /**
   * Check if dashboard is displayed
   */
  async isDashboardVisible(): Promise<boolean> {
    return this.welcomeText.isVisible();
  }
}
