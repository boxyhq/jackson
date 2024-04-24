import { Locator, Page, expect } from '@playwright/test';

export class Portal {
  userAvatarLocator: Locator;
  constructor(public readonly page: Page) {
    this.userAvatarLocator = this.page.getByTestId('user-avatar');
  }
  async isLoggedIn() {
    // assert login state
    await expect(this.userAvatarLocator).toBeVisible();
  }
}
