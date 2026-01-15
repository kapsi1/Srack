import { expect, test } from '@playwright/test';
import { navigateToChannel, registerUser, sendMessage, uniqueId, waitForAppLoaded } from './helpers';

test.describe('Saved Messages', () => {
	test.beforeEach(async ({ page }) => {
		await registerUser(page);
		await waitForAppLoaded(page);
	});

	test('should navigate to Saved items view', async ({ page }) => {
		// Navigate directly to saved items
		await page.getByRole('link', { name: 'Saved items' }).click();

		// Should see the Saved items view
		await expect(page.getByText('Saved items').first()).toBeVisible();
	});

	test('should show bookmark button on message hover', async ({ page }) => {
		await navigateToChannel(page, 'general');

		// Send a message
		const message = `hover-${uniqueId()}`;
		await sendMessage(page, message);

		// Hover over the message
		await page.getByText(message).hover();

		// Action bar should appear with bookmark icon
		await expect(page.locator('.lucide-bookmark').first()).toBeVisible({ timeout: 5000 });
	});

	test('should have clickable bookmark button', async ({ page }) => {
		await navigateToChannel(page, 'general');

		// Send a message
		const message = `bookmark-click-${uniqueId()}`;
		await sendMessage(page, message);

		// Hover and click bookmark
		await page.getByText(message).hover();
		const bookmarkBtn = page.locator('.lucide-bookmark').first();
		await expect(bookmarkBtn).toBeVisible({ timeout: 5000 });

		// Clicking should not throw error
		await bookmarkBtn.click();
	});
});
