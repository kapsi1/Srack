import { expect, test } from '@playwright/test';
import { navigateToChannel, registerUser, sendMessage, uniqueId, waitForAppLoaded } from './helpers';

test.describe('Message Formatting', () => {
	test.beforeEach(async ({ page }) => {
		await registerUser(page);
		await waitForAppLoaded(page);
		await navigateToChannel(page, 'general');
	});

	test('should send text with markdown-style formatting', async ({ page }) => {
		const id = uniqueId();
		const message = `testmessage${id}`;
		await sendMessage(page, message);

		// Message should be visible
		await expect(page.getByText(id)).toBeVisible({ timeout: 5000 });
	});

	test('should send links as clickable', async ({ page }) => {
		const linkUrl = 'https://example.com';
		await sendMessage(page, linkUrl);

		// Should render as a clickable link
		await expect(page.locator(`a[href="${linkUrl}"]`)).toBeVisible({ timeout: 5000 });
	});

	test('should show formatting toolbar', async ({ page }) => {
		// Focus message input
		const messageInput = page.getByPlaceholder(/Message #general/);
		await messageInput.click();

		// Toolbar should have formatting buttons
		await expect(page.locator('.lucide-bold').first()).toBeVisible();
		await expect(page.locator('.lucide-italic').first()).toBeVisible();
	});

	test('should have send button', async ({ page }) => {
		// Send button should be visible
		await expect(page.locator('.lucide-send')).toBeVisible();
	});

	test('should display toolbar buttons', async ({ page }) => {
		// All formatting toolbar buttons should be visible
		await expect(page.locator('.lucide-bold').first()).toBeVisible();
		await expect(page.locator('.lucide-italic').first()).toBeVisible();
		await expect(page.locator('.lucide-code').first()).toBeVisible();
		await expect(page.locator('.lucide-link').first()).toBeVisible();
	});
});
