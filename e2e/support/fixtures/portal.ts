import { Locator, Page, expect } from '@playwright/test';

export class Portal {
  userAvatarLocator: Locator;
  constructor(public readonly page: Page) {
    this.userAvatarLocator = this.page.getByTestId('user-avatar');
  }

  async doCredentialsLogin() {
    await this.page.goto('/admin/auth/login');
    await this.page.getByPlaceholder('Email').fill('super@boxyhq.com');
    await this.page.getByPlaceholder('Password').fill('999login');
    await this.page.getByRole('button', { name: 'Sign In' }).click();
  }

  async isLoggedIn() {
    // assert login state
    await expect(this.userAvatarLocator).toBeVisible();
  }
}
