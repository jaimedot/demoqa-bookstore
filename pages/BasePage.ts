import { Page } from '@playwright/test';

/**
 * Shared behaviour for every Page Object.
 *
 * DemoQA embeds third-party ad iframes that frequently overlap real controls
 * and cause clicks to miss. `hideAds()` removes those containers so tests are
 * stable. All page objects extend this class.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Navigate to a path relative to the configured baseURL. */
  async goto(path: string): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    await this.hideAds();
  }

  /** Remove ad/fixed banners that can intercept pointer events on DemoQA. */
  async hideAds(): Promise<void> {
    await this.page
      .addStyleTag({
        content: `
          #fixedban, footer, .ad, iframe[id^='google_ads'],
          #adplus-anchor, .Ad, ins.adsbygoogle { display: none !important; }
        `,
      })
      .catch(() => undefined);
  }
}
