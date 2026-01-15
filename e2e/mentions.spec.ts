import { expect, test } from '@playwright/test';
import { navigateToChannel, registerUser, sendMessage, uniqueId, waitForAppLoaded } from './helpers';

test.describe('Mentions', () => {
	test.beforeEach(async ({ page }) => {
		await registerUser(page);
		await waitForAppLoaded(page);
	});

	test('should show @ button in message toolbar', async ({ page }) => {
		await navigateToChannel(page, 'general');

		// @ button should be visible in the message input toolbar
		await expect(page.locator('.lucide-at-sign').first()).toBeVisible();
	});

	test('should send message with mention text', async ({ page }) => {
		await navigateToChannel(page, 'general');

		// Send a message with a mention
		const id = uniqueId();
		const message = `Hello @testuser ${id}`;
		await sendMessage(page, message);

		// Message should appear (look for the unique ID)
		await expect(page.getByText(id)).toBeVisible({ timeout: 10000 });
	});

	test('should access Mentions & Reactions view', async ({ page }) => {
		// Click on Mentions & reactions in sidebar
		await page.getByRole('link', { name: 'Mentions & reactions' }).click();

		// Should see the mentions view
		await expect(page.getByText('Mentions & reactions').first()).toBeVisible();
	});

	test('should type @ in message input', async ({ page }) => {
		await navigateToChannel(page, 'general');

		// Focus on message input and type @
		const messageInput = page.getByPlaceholder(/Message #general/);
		await messageInput.fill('@');

		// @ should be in the input
		await expect(messageInput).toHaveValue('@');
	});
});
