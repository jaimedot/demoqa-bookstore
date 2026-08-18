// Source: output/user-stories/user-stories.md (US-001 AC4, AC5)
// Coverage: output/coverage/coverage-audit.md (Table A gaps)
import { test, expect } from '@playwright/test';
import { BooksPage } from '../../pages/BooksPage.js';

/**
 * UI tests closing Table-A gaps on the Book Store catalogue:
 *   - US-001 AC4: clicking a book title opens its detail view
 *   - US-001 AC5: pagination controls are disabled on a single page
 */
test.describe('Book Store - Catalogue (coverage gaps)', () => {
  let booksPage: BooksPage;

  test.beforeEach(async ({ page }) => {
    booksPage = new BooksPage(page);
    await booksPage.open();
  });

  test('opens a book detail view when a title is clicked (US-001 AC4)', async ({ page }) => {
    await booksPage.openBookDetail('Git Pocket Guide');

    // The detail view exposes the book's data and a "Back To Book Store" button.
    expect(await booksPage.isBookDetailVisible()).toBeTruthy();
    await expect(page.getByText('Git Pocket Guide')).toBeVisible();
  });

  test('disables pagination controls on a single page (US-001 AC5)', async () => {
    expect(await booksPage.isPreviousDisabled()).toBeTruthy();
    expect(await booksPage.isNextDisabled()).toBeTruthy();
  });
});
