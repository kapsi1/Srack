import { test, expect } from '@playwright/test';

test('register and login flow', async ({ page }) => {
  await page.goto('/');
  
  // Register
  await page.getByText("Don't have an account? Sign up").click();
  const uniqueId = Date.now();
  await page.fill('#username', `user_${uniqueId}`);
  await page.fill('#email', `user_${uniqueId}@example.com`);
  await page.fill('#password', 'password123');
  await page.getByRole('button', { name: 'Create Account' }).click();

  // Should be logged in and see Workspace Name or Channels
  await expect(page.getByText('Workspace Name')).toBeVisible({ timeout: 30000 });
  
  // Logout
  // Finding logout icon relative to user profile logic if possible, or just the icon class
  await page.locator('.lucide-log-out').first().click();

  // Should be back to login
  await expect(page.getByText('Welcome to Srack')).toBeVisible();
});
