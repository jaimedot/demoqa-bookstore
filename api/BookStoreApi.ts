import { APIRequestContext, APIResponse } from '@playwright/test';
import { UserCredentials } from '../utils/testData.js';

/**
 * Thin, reusable client over the DemoQA Book Store REST API.
 *
 * Each method maps to one Swagger endpoint and returns the raw APIResponse so
 * tests can assert on status codes and bodies. Keeping HTTP details here (paths,
 * headers, auth) means the test files stay short and readable.
 *
 * Swagger: https://demoqa.com/swagger
 */
export class BookStoreApi {
  constructor(private readonly request: APIRequestContext) {}

  // ----- Account endpoints -----------------------------------------------

  /** POST /Account/v1/User — register a new user. */
  createUser(user: UserCredentials): Promise<APIResponse> {
    return this.request.post('/Account/v1/User', { data: user });
  }

  /** GET /Account/v1/User/{UUID} — fetch a user (requires bearer token). */
  getUser(userId: string, token: string): Promise<APIResponse> {
    return this.request.get(`/Account/v1/User/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /** DELETE /Account/v1/User/{UUID} — delete a user (requires bearer token). */
  deleteUser(userId: string, token: string): Promise<APIResponse> {
    return this.request.delete(`/Account/v1/User/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /** POST /Account/v1/GenerateToken — obtain a JWT for the user. */
  generateToken(user: UserCredentials): Promise<APIResponse> {
    return this.request.post('/Account/v1/GenerateToken', { data: user });
  }

  /** POST /Account/v1/Authorized — check whether credentials are authorized. */
  isAuthorized(user: UserCredentials): Promise<APIResponse> {
    return this.request.post('/Account/v1/Authorized', { data: user });
  }

  // ----- BookStore endpoints ---------------------------------------------

  /** GET /BookStore/v1/Books — list all available books (public). */
  listBooks(): Promise<APIResponse> {
    return this.request.get('/BookStore/v1/Books');
  }

  /** GET /BookStore/v1/Book?ISBN=... — fetch a single book by ISBN (public). */
  getBookByIsbn(isbn: string): Promise<APIResponse> {
    return this.request.get('/BookStore/v1/Book', { params: { ISBN: isbn } });
  }

  /** POST /BookStore/v1/Books — add books to a user's collection (auth). */
  addBooks(userId: string, isbns: string[], token: string): Promise<APIResponse> {
    return this.request.post('/BookStore/v1/Books', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        userId,
        collectionOfIsbns: isbns.map((isbn) => ({ isbn })),
      },
    });
  }

  /** DELETE /BookStore/v1/Books?UserId=... — remove all books for a user (auth). */
  deleteAllBooks(userId: string, token: string): Promise<APIResponse> {
    return this.request.delete('/BookStore/v1/Books', {
      headers: { Authorization: `Bearer ${token}` },
      params: { UserId: userId },
    });
  }
}
