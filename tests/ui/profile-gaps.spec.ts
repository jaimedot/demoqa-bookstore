// Source: output/user-stories/user-stories.md (US-005 AC1/AC2/AC4/AC5, US-006 AC1/AC2)
// Coverage: output/coverage/coverage-audit.md (Table A gaps)
import { test, expect, request as playwrightRequest, APIRequestContext } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { ProfilePage } from '../../pages/ProfilePage.js';
import { BookStoreApi } from '../../api/BookStoreApi.js';
import { generateValidUser, UserCredentials } from '../../utils/testData.js';

interface SeededUser {
  user: UserCredentials;
  userId: string;
  token: string;
  firstIsbn: string;
  firstTitle: string;
  secondTitle: string;
}

/**
 * Provisions a fresh user via the API and adds two books to their collection.
 * Using the API for setup keeps these UI tests fast and isolated.
 */
async function seedUserWithBooks(context: APIRequestContext): Promise<SeededUser> {
  const api = new BookStoreApi(context);
  const user = generateValidUser();

  const { userID } = await (await api.createUser(user)).json();
  const { token } = await (await api.generateToken(user)).json();
  const { books } = await (await api.listBooks()).json();

  await api.addBooks(userID, [books[0].isbn, books[1].isbn], token);

  return {
    user,
    userId: userID,
    token,
    firstIsbn: books[0].isbn,
    firstTitle: books[0].title,
    secondTitle: books[1].title,
  };
}

/**
 * UI tests closing Table-A gaps on the Profile page. Each test provisions its
 * own user (isolated), logs in through the UI, then exercises the collection.
 */
test.describe('Book Store - Profile management (coverage gaps)', () => {
  let seeded: SeededUser;

  test.beforeEach(async ({ page }) => {
    const context = await playwrightRequest.newContext({ baseURL: 'https://demoqa.com' });
    seeded = await seedUserWithBooks(context);
    await context.dispose();

    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login(seeded.user.userName, seeded.user.password);
    // Login redirects to /profile; confirm we are authenticated.
    await expect(page.locator('#userName-value')).toBeVisible();
  });

  test.afterEach(async () => {
    const context = await playwrightRequest.newContext({ baseURL: 'https://demoqa.com' });
    const api = new BookStoreApi(context);
    await api.deleteUser(seeded.userId, seeded.token).catch(() => undefined);
    await context.dispose();
  });

  test('displays the collection with the seeded books (US-005 AC1)', async ({ page }) => {
    const profilePage = new ProfilePage(page);

    await expect(page.locator(`a:has-text("${seeded.firstTitle}")`)).toBeVisible();
    const titles = await profilePage.getCollectionTitles();
    expect(titles).toContain(seeded.firstTitle);
    expect(titles).toContain(seeded.secondTitle);
  });

  test('removes a single book via the UI (US-005 AC2)', async ({ page }) => {
    const profilePage = new ProfilePage(page);

    await expect(page.locator(`a:has-text("${seeded.firstTitle}")`)).toBeVisible();
    await profilePage.deleteBookByIsbn(seeded.firstIsbn);

    const titles = await profilePage.getCollectionTitles();
    expect(titles).not.toContain(seeded.firstTitle);
    // The other seeded book must remain.
    expect(titles).toContain(seeded.secondTitle);
  });

  test('filters the collection with the profile search (US-005 AC5)', async ({ page }) => {
    const profilePage = new ProfilePage(page);

    await expect(page.locator(`a:has-text("${seeded.firstTitle}")`)).toBeVisible();
    await profilePage.searchCollection(seeded.firstTitle);

    const titles = await profilePage.getCollectionTitles();
    expect(titles).toContain(seeded.firstTitle);
    expect(titles).not.toContain(seeded.secondTitle);
  });

  test('shows an empty collection after removing all books (US-005 AC4)', async ({ page }) => {
    const profilePage = new ProfilePage(page);

    // Remove all books for this user via the API, then reload the profile.
    const context = await playwrightRequest.newContext({ baseURL: 'https://demoqa.com' });
    const api = new BookStoreApi(context);
    await api.deleteAllBooks(seeded.userId, seeded.token);
    await context.dispose();

    await profilePage.open();
    expect(await profilePage.getCollectionCount()).toBe(0);
  });

  test('logs out and returns to the login page (US-006 AC1)', async ({ page }) => {
    const profilePage = new ProfilePage(page);

    await profilePage.logout();
    expect(new URL(page.url()).pathname).toBe('/login');
  });

  test('shows the not-logged-in prompt after logout (US-006 AC2)', async ({ page }) => {
    const profilePage = new ProfilePage(page);

    await profilePage.logout();
    // Navigating back to /profile while unauthenticated shows the prompt.
    await page.goto('https://demoqa.com/profile', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('not logged into the Book Store')).toBeVisible();
    expect(await profilePage.isNotLoggedInPromptVisible()).toBeTruthy();
  });
});
