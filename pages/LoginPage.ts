import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Page Object for the DemoQA login screen (https://demoqa.com/login).
 * Encapsulates the username/password fields and the login button so that
 * tests never reference raw selectors directly.
 */
export class LoginPage extends BasePage {
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly newUserButton: Locator;
  private readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('#userName');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('#login');
    this.newUserButton = page.locator('#newUser');
    this.errorMessage = page.locator('#name');
  }

  async open(): Promise<void> {
    await this.goto('/login');
    await expect(this.usernameInput).toBeVisible();
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /** Text of the inline validation/error message shown on failed login. */
  async getErrorMessage(): Promise<string> {
    await expect(this.errorMessage).toBeVisible();
    return (await this.errorMessage.textContent())?.trim() ?? '';
  }

  /** Clicks Login without entering any credentials (triggers required-field validation). */
  async submitEmpty(): Promise<void> {
    await this.loginButton.click();
  }

  /** Whether the username input carries the Bootstrap `is-invalid` marker. */
  async isUsernameInvalid(): Promise<boolean> {
    const className = (await this.usernameInput.getAttribute('class')) ?? '';
    return className.includes('is-invalid');
  }

  /** Whether the password input carries the Bootstrap `is-invalid` marker. */
  async isPasswordInvalid(): Promise<boolean> {
    const className = (await this.passwordInput.getAttribute('class')) ?? '';
    return className.includes('is-invalid');
  }

  /** Navigates to the registration page via the "New User" button. */
  async clickNewUser(): Promise<void> {
    await this.newUserButton.click();
  }
}
