import { test, expect } from '../../fixtures/apiFixtures.js';

/**
 * API tests for the BookStore service.
 * Covers listing books, fetching by ISBN, the authenticated add/remove flow,
 * and an authorization negative test.
 */
test.describe('BookStore API', () => {
  test('returns the list of available books', async ({ api }) => {
    const response = await api.listBooks();

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.books)).toBeTruthy();
    expect(body.books.length).toBeGreaterThan(0);

    // Validate the shape of a book entry.
    const [firstBook] = body.books;
    expect(firstBook).toMatchObject({
      isbn: expect.any(String),
      title: expect.any(String),
      author: expect.any(String),
    });
  });

  test('fetches a single book by ISBN', async ({ api }) => {
    const listResponse = await api.listBooks();
    const { books } = await listResponse.json();
    const targetIsbn = books[0].isbn;

    const response = await api.getBookByIsbn(targetIsbn);

    expect(response.status()).toBe(200);
    const book = await response.json();
    expect(book.isbn).toBe(targetIsbn);
    expect(book.title).toBe(books[0].title);
  });

  test('returns 400 for a non-existent ISBN', async ({ api }) => {
    const response = await api.getBookByIsbn('0000000000000');

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message).toContain('ISBN supplied is not available');
  });

  test('adds a book to a user collection with a valid token', async ({
    api,
    authorizedUser,
  }) => {
    const { books } = await (await api.listBooks()).json();
    const isbn = books[0].isbn;

    const response = await api.addBooks(authorizedUser.userId, [isbn], authorizedUser.token);

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.books.map((b: { isbn: string }) => b.isbn)).toContain(isbn);

    // Verify persistence via GET user.
    const userResponse = await api.getUser(authorizedUser.userId, authorizedUser.token);
    const userBody = await userResponse.json();
    expect(userBody.books.map((b: { isbn: string }) => b.isbn)).toContain(isbn);
  });

  test('rejects adding a book without a token (401)', async ({ api, authorizedUser }) => {
    const { books } = await (await api.listBooks()).json();

    const response = await api.addBooks(authorizedUser.userId, [books[0].isbn], '');

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.message).toContain('not authorized');
  });

  test('removes all books from a user collection', async ({ api, authorizedUser }) => {
    const { books } = await (await api.listBooks()).json();
    await api.addBooks(authorizedUser.userId, [books[0].isbn], authorizedUser.token);

    const deleteResponse = await api.deleteAllBooks(authorizedUser.userId, authorizedUser.token);
    expect(deleteResponse.status()).toBe(204);

    const userResponse = await api.getUser(authorizedUser.userId, authorizedUser.token);
    const userBody = await userResponse.json();
    expect(userBody.books).toHaveLength(0);
  });
});
