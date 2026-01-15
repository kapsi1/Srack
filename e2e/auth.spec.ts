import { expect, test } from '@playwright/test';

const TEST_PREFIX = 'test__';

test('register and login flow', async ({ page }) => {
	await page.goto('/');

	// Register
	await page.getByText("Don't have an account? Sign up").click();
	const uniqueId = Date.now();
	await page.fill('#username', `${TEST_PREFIX}user_${uniqueId}`);
	await page.fill('#email', `${TEST_PREFIX}user_${uniqueId}@example.com`);
	await page.fill('#password', 'password123');
	await page.getByRole('button', { name: 'Create Account' }).click();

	// Should be logged in and see Snack or Channels
	await expect(page.getByText('Snack')).toBeVisible({ timeout: 30000 });

	// Logout
	await page.locator('.lucide-log-out').first().click();

	// Should be back to login
	await expect(page.getByText('Welcome to Snack')).toBeVisible();
});
