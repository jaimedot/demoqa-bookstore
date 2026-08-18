import { test, expect, request as playwrightRequest } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { ProfilePage } from '../../pages/ProfilePage.js';
import { BookStoreApi } from '../../api/BookStoreApi.js';
import { generateValidUser, UserCredentials } from '../../utils/testData.js';

/**
 * End-to-end style UI test that combines API setup with UI verification:
 *   1. Register a user and add a book to their collection via the API (fast).
 *   2. Log in through the UI.
 *   3. Verify the book appears in the profile collection on screen.
 *
 * This demonstrates a hybrid strategy: use the API to arrange state quickly,
 * then assert the user-facing result through the browser.
 */
test.describe('Book Store - Profile collection', () => {
  let user: UserCredentials;
  let userId: string;
  let token: string;
  let expectedTitle: string;

  test.beforeAll(async () => {
    const context = await playwrightRequest.newContext({ baseURL: 'https://demoqa.com' });
    const api = new BookStoreApi(context);
    user = generateValidUser();

    const createResponse = await api.createUser(user);
    ({ userID: userId } = await createResponse.json());
    const tokenResponse = await api.generateToken(user);
    ({ token } = await tokenResponse.json());

    const { books } = await (await api.listBooks()).json();
    expectedTitle = books[0].title;
    await api.addBooks(userId, [books[0].isbn], token);

    await context.dispose();
  });

  test.afterAll(async () => {
    const context = await playwrightRequest.newContext({ baseURL: 'https://demoqa.com' });
    const api = new BookStoreApi(context);
    await api.deleteUser(userId, token).catch(() => undefined);
    await context.dispose();
  });

  test('shows the added book in the user profile', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const profilePage = new ProfilePage(page);

    await loginPage.open();
    await loginPage.login(user.userName, user.password);

    // Login redirects to /profile; confirm we are authenticated there.
    expect(await profilePage.getLoggedInUserName()).toBe(user.userName);

    // The book link is rendered asynchronously after the profile loads.
    await expect(page.locator(`a:has-text("${expectedTitle}")`)).toBeVisible();

    const titles = await profilePage.getCollectionTitles();
    expect(titles).toContain(expectedTitle);
  });
});
