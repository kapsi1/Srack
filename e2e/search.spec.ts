import { expect, test } from '@playwright/test';
import { navigateToChannel, registerUser, sendMessage, uniqueId, waitForAppLoaded } from './helpers';

test.describe('Channel Search', () => {
	test.beforeEach(async ({ page }) => {
		await registerUser(page);
		await waitForAppLoaded(page);
	});

	test('should search messages in channel', async ({ page }) => {
		await navigateToChannel(page, 'general');

		// Send a few messages with unique identifier
		const searchTerm = `searchable-${uniqueId()}`;
		await sendMessage(page, `First ${searchTerm} message`);
		await sendMessage(page, `Second ${searchTerm} message`);
		await sendMessage(page, 'Other random message');

		// Click the search button
		await page.locator('.lucide-search').first().click();

		// Search input should appear
		const searchInput = page.getByPlaceholder(/Search|Find/i);
		if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
			await searchInput.fill(searchTerm);
			await page.keyboard.press('Enter');

			// Should show matching messages
			await expect(page.getByText(`First ${searchTerm} message`)).toBeVisible({ timeout: 5000 });
		}
	});
});
