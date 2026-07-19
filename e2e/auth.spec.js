import { test, expect } from '@playwright/test';

// The auth page has a "Sign In" tab toggle AND a "Sign In" submit button — scope
// to the form's submit to disambiguate.
const submitSignIn = (page) => page.locator('form').getByRole('button', { name: /sign in/i });

// Requires the backend stack running and a seeded user (tx1@example.com / pass123).
test.describe('Authentication', () => {
  test('logs in and lands on /chat', async ({ page }) => {
    await page.goto('/signin');
    await page.getByPlaceholder('Enter your email').fill('tx1@example.com');
    await page.getByPlaceholder('Enter your password').fill('pass123');
    await submitSignIn(page).click();

    await expect(page).toHaveURL(/\/chat/, { timeout: 15_000 });
    await expect(page.getByTestId('sidebar')).toBeVisible();
  });

  test('shows an error on bad credentials', async ({ page }) => {
    await page.goto('/signin');
    await page.getByPlaceholder('Enter your email').fill('tx1@example.com');
    await page.getByPlaceholder('Enter your password').fill('definitely-wrong');
    await submitSignIn(page).click();

    await expect(page.getByText(/invalid credentials|sign in failed/i)).toBeVisible();
    await expect(page).not.toHaveURL(/\/chat/);
  });

  test('protected route redirects unauthenticated users to /signin', async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/chat');
    await expect(page).toHaveURL(/\/signin/);
  });
});
