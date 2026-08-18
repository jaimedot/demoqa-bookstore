// Source: output/user-stories/user-stories.md (US-002 AC3, US-003 AC1)
// Coverage: output/coverage/coverage-audit.md (Table A gaps)
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';

/**
 * UI tests closing Table-A gaps on the Login screen:
 *   - US-002 AC3: empty-field submit marks both inputs invalid
 *   - US-003 AC1: the "New User" button navigates to the registration page
 */
test.describe('Book Store - Login (coverage gaps)', () => {
  test('marks both fields invalid on empty submit (US-002 AC3)', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.open();
    await loginPage.submitEmpty();

    expect(await loginPage.isUsernameInvalid()).toBeTruthy();
    expect(await loginPage.isPasswordInvalid()).toBeTruthy();
    // The form must not navigate away on invalid submit.
    expect(new URL(page.url()).pathname).toBe('/login');
  });

  test('navigates to registration via "New User" (US-003 AC1)', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.open();
    await loginPage.clickNewUser();

    await page.waitForURL('**/register');
    expect(new URL(page.url()).pathname).toBe('/register');
  });
});
