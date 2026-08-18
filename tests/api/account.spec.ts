import { test, expect } from '../../fixtures/apiFixtures.js';
import { BookStoreApi } from '../../api/BookStoreApi.js';
import { generateValidUser, generateUserName, WEAK_PASSWORD } from '../../utils/testData.js';

/**
 * API tests for the Account service.
 * Covers positive user creation, negative validation, token generation,
 * authorization checks, and cleanup.
 */
test.describe('Account API', () => {
  test('creates a new user with valid credentials', async ({ api }) => {
    const user = generateValidUser();

    const response = await api.createUser(user);

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('userID');
    expect(body.username).toBe(user.userName);

    // Cleanup: obtain a token then delete the user.
    const tokenResponse = await api.generateToken(user);
    const { token } = await tokenResponse.json();
    await api.deleteUser(body.userID, token);
  });

  test('rejects user creation with a weak password', async ({ api }) => {
    const invalidUser = { userName: generateUserName(), password: WEAK_PASSWORD };

    const response = await api.createUser(invalidUser);

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message).toContain('Passwords must have');
  });

  test('does not allow creating a duplicate user', async ({ api }) => {
    const user = generateValidUser();

    const first = await api.createUser(user);
    expect(first.status()).toBe(201);
    const { userID } = await first.json();

    const duplicate = await api.createUser(user);
    expect(duplicate.status()).toBe(406);
    const body = await duplicate.json();
    expect(body.message).toContain('User exists');

    const tokenResponse = await api.generateToken(user);
    const { token } = await tokenResponse.json();
    await api.deleteUser(userID, token);
  });

  test('generates a token for valid credentials', async ({ authorizedUser, request }) => {
    const api = new BookStoreApi(request);

    const response = await api.generateToken(authorizedUser.credentials);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.token).toBeTruthy();
    expect(body.status).toBe('Success');
    expect(body.result).toContain('successful');
  });

  test('fails token generation for invalid credentials', async ({ api }) => {
    const response = await api.generateToken({
      userName: generateUserName(),
      password: 'Wrong_Pass_123!',
    });

    // DemoQA returns 200 with a failure body for bad credentials.
    const body = await response.json();
    expect(body.token).toBeNull();
    expect(body.status).toBe('Failed');
    expect(body.result).toContain('authorization failed');
  });

  test('confirms an authorized user via /Authorized', async ({ authorizedUser, api }) => {
    const response = await api.isAuthorized(authorizedUser.credentials);

    expect(response.status()).toBe(200);
    expect(await response.json()).toBe(true);
  });
});
