import { test, expect } from '@playwright/test';
import { BooksPage } from '../../pages/BooksPage.js';

/**
 * UI tests for the Book Store search feature.
 * These are public (no login) and validate both positive and empty-result paths.
 */
test.describe('Book Store - Search', () => {
  let booksPage: BooksPage;

  test.beforeEach(async ({ page }) => {
    booksPage = new BooksPage(page);
    await booksPage.open();
  });

  test('finds books matching a known keyword', async () => {
    await booksPage.search('Git');

    const titles = await booksPage.getVisibleBookTitles();
    expect(titles.length).toBeGreaterThan(0);
    expect(titles.join(' ').toLowerCase()).toContain('git');
  });

  test('shows no data for a term with no matches', async () => {
    await booksPage.search('zzz-nonexistent-book-xyz');

    expect(await booksPage.getResultCount()).toBe(0);
  });

  test('lists multiple books by default', async () => {
    const titles = await booksPage.getVisibleBookTitles();
    // DemoQA ships with a fixed catalogue of several books.
    expect(titles.length).toBeGreaterThanOrEqual(2);
  });
});
