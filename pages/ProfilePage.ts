import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Page Object for the logged-in profile page (https://demoqa.com/profile),
 * where a user's book collection is displayed.
 *
 * Note: DemoQA reuses the id `#submit` for Logout, Delete Account, and Delete
 * All Books, so those controls are targeted by their accessible (button) name
 * rather than by id.
 */
export class ProfilePage extends BasePage {
  private readonly userNameLabel: Locator;
  private readonly logoutButton: Locator;
  private readonly searchBox: Locator;
  private readonly bookRows: Locator;
  private readonly notLoggedInMessage: Locator;
  private readonly deleteModalOk: Locator;

  constructor(page: Page) {
    super(page);
    this.userNameLabel = page.locator('#userName-value');
    // Non-unique #submit -> select by accessible name instead.
    // On the profile page the button label is "Logout" (no space); the login
    // "already logged in" panel uses "Log out" (with space) - different screen.
    this.logoutButton = page.getByRole('button', { name: 'Logout', exact: true });
    this.searchBox = page.locator('#searchBox');
    this.bookRows = page.locator('a[href*="books?search="]');
    // Unauthenticated /profile shows this prompt (not the #name error element).
    this.notLoggedInMessage = page.getByText('not logged into the Book Store', {
      exact: false,
    });
    this.deleteModalOk = page.locator('#closeSmallModal-ok');
  }

  async open(): Promise<void> {
    await this.goto('/profile');
    // Wait until the profile has hydrated (username label rendered).
    await expect(this.userNameLabel).toBeVisible();
  }

  async getLoggedInUserName(): Promise<string> {
    await expect(this.userNameLabel).toBeVisible();
    return (await this.userNameLabel.textContent())?.trim() ?? '';
  }

  async isLoggedIn(): Promise<boolean> {
    return this.userNameLabel.isVisible();
  }

  async getCollectionTitles(): Promise<string[]> {
    const titles = await this.bookRows.allInnerTexts();
    return titles.map((title) => title.trim()).filter(Boolean);
  }

  /** Number of books currently visible in the collection table. */
  async getCollectionCount(): Promise<number> {
    return this.bookRows.count();
  }

  /** Filters the user's collection using the profile search box (client-side). */
  async searchCollection(term: string): Promise<void> {
    await this.searchBox.fill(term);
    // Collection filters client-side; give the table a moment to re-render.
    await this.page.waitForTimeout(500);
  }

  /**
   * Removes a single book by ISBN. Clicks the row delete icon, confirms the
   * "Delete Book" modal, and accepts the native "Book deleted." alert that
   * DemoQA raises afterwards, then waits for the row to detach.
   */
  async deleteBookByIsbn(isbn: string): Promise<void> {
    // The app raises a native alert after deletion; accept it automatically.
    this.page.once('dialog', (dialog) => {
      void dialog.accept();
    });
    await this.page.locator(`#delete-record-${isbn}`).click();
    await expect(this.deleteModalOk).toBeVisible();
    await this.deleteModalOk.click();
    await this.page
      .locator(`a[href*="books?search=${isbn}"]`)
      .waitFor({ state: 'detached' });
  }

  /** Logs out and returns to the login screen. */
  async logout(): Promise<void> {
    await this.logoutButton.click();
    await this.page.waitForURL('**/login');
  }

  /** True when the "not logged in" prompt is shown (unauthenticated profile). */
  async isNotLoggedInPromptVisible(): Promise<boolean> {
    return this.notLoggedInMessage.isVisible();
  }
}
