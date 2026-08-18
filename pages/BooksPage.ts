import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Page Object for the Book Store listing (https://demoqa.com/books).
 * Provides search and read operations over the books table.
 *
 * Book title links point to "/books?search=<ISBN>", which gives us a stable,
 * implementation-independent selector for the rows.
 */
export class BooksPage extends BasePage {
  private readonly searchBox: Locator;
  private readonly bookLinks: Locator;
  private readonly previousButton: Locator;
  private readonly nextButton: Locator;
  private readonly pageStatus: Locator;
  private readonly backToStoreButton: Locator;

  constructor(page: Page) {
    super(page);
    this.searchBox = page.locator('#searchBox');
    this.bookLinks = page.locator('a[href*="books?search="]');
    this.previousButton = page.getByRole('button', { name: 'Previous' });
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.pageStatus = page.locator('.-pageInfo');
    this.backToStoreButton = page.getByRole('button', { name: 'Back To Book Store' });
  }

  async open(): Promise<void> {
    await this.goto('/books');
    await expect(this.searchBox).toBeVisible();
    // Books render asynchronously; wait for the first row to appear.
    await this.bookLinks.first().waitFor({ state: 'visible' });
  }

  async search(term: string): Promise<void> {
    await this.searchBox.fill(term);
    // DemoQA filters client-side; give the table a moment to re-render.
    await this.page.waitForTimeout(750);
  }

  /** Titles of the books currently visible in the table. */
  async getVisibleBookTitles(): Promise<string[]> {
    const titles = await this.bookLinks.allInnerTexts();
    return titles.map((title) => title.trim()).filter(Boolean);
  }

  async getResultCount(): Promise<number> {
    return this.bookLinks.count();
  }

  async openBook(title: string): Promise<void> {
    await this.bookLinks.filter({ hasText: title }).first().click();
  }

  /** Whether the "Previous" pagination control is disabled. */
  async isPreviousDisabled(): Promise<boolean> {
    return this.previousButton.isDisabled();
  }

  /** Whether the "Next" pagination control is disabled. */
  async isNextDisabled(): Promise<boolean> {
    return this.nextButton.isDisabled();
  }

  /**
   * Opens a book's detail view by clicking its title link and waits for the
   * detail page (identified by the "Back To Book Store" button) to render.
   */
  async openBookDetail(title: string): Promise<void> {
    await this.openBook(title);
    await this.backToStoreButton.waitFor({ state: 'visible' });
  }

  /** True when the single-book detail view is displayed. */
  async isBookDetailVisible(): Promise<boolean> {
    return this.backToStoreButton.isVisible();
  }
}
