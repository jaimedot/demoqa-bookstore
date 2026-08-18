import { test, expect, request as playwrightRequest } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { ProfilePage } from '../../pages/ProfilePage.js';
import { BookStoreApi } from '../../api/BookStoreApi.js';
import { generateValidUser, UserCredentials } from '../../utils/testData.js';

/**
 * UI tests for authentication.
 *
 * To avoid depending on a manually-created account, we register a fresh user
 * through the API before the valid-login test. This keeps the UI suite
 * self-contained and repeatable.
 */
test.describe('Book Store - Login', () => {
  let validUser: UserCredentials;
  let userId: string;
  let token: string;

  test.beforeAll(async () => {
    const context = await playwrightRequest.newContext({ baseURL: 'https://demoqa.com' });
    const api = new BookStoreApi(context);
    validUser = generateValidUser();

    const createResponse = await api.createUser(validUser);
    ({ userID: userId } = await createResponse.json());
    const tokenResponse = await api.generateToken(validUser);
    ({ token } = await tokenResponse.json());
    await context.dispose();
  });

  test.afterAll(async () => {
    const context = await playwrightRequest.newContext({ baseURL: 'https://demoqa.com' });
    const api = new BookStoreApi(context);
    await api.deleteUser(userId, token).catch(() => undefined);
    await context.dispose();
  });

  test('logs in successfully with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const profilePage = new ProfilePage(page);

    await loginPage.open();
    await loginPage.login(validUser.userName, validUser.password);

    expect(await profilePage.getLoggedInUserName()).toBe(validUser.userName);
  });

  test('shows an error with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.open();
    await loginPage.login('definitely_not_a_user', 'Wrong_Pass_123!');

    expect(await loginPage.getErrorMessage()).toContain('Invalid username or password');
  });
});
