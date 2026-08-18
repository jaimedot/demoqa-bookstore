import { test as base, expect, APIRequestContext } from '@playwright/test';
import { BookStoreApi } from '../api/BookStoreApi.js';
import { generateValidUser, UserCredentials } from '../utils/testData.js';

/**
 * Custom Playwright fixtures for the API suite.
 *
 * - `api`: a ready-to-use BookStoreApi client bound to the request context.
 * - `authorizedUser`: a freshly registered user WITH a valid token and userId.
 *   It is created before the test and deleted afterwards, so every test starts
 *   from a clean, isolated state (no shared data between tests).
 */

export interface AuthorizedUser {
  credentials: UserCredentials;
  userId: string;
  token: string;
}

interface ApiFixtures {
  api: BookStoreApi;
  authorizedUser: AuthorizedUser;
}

async function registerUserWithToken(
  request: APIRequestContext,
): Promise<AuthorizedUser> {
  const api = new BookStoreApi(request);
  const credentials = generateValidUser();

  const createResponse = await api.createUser(credentials);
  expect(
    createResponse.ok(),
    `Failed to create user: ${await createResponse.text()}`,
  ).toBeTruthy();
  const { userID } = await createResponse.json();

  const tokenResponse = await api.generateToken(credentials);
  expect(tokenResponse.ok()).toBeTruthy();
  const { token } = await tokenResponse.json();

  return { credentials, userId: userID, token };
}

export const test = base.extend<ApiFixtures>({
  api: async ({ request }, use) => {
    await use(new BookStoreApi(request));
  },

  authorizedUser: async ({ request }, use) => {
    const user = await registerUserWithToken(request);

    await use(user);

    // Teardown: best-effort cleanup so we don't leave test users behind.
    const api = new BookStoreApi(request);
    await api.deleteUser(user.userId, user.token).catch(() => undefined);
  },
});

export { expect };
