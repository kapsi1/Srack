import { expect, test } from '@playwright/test';
import { navigateToChannel, registerUser, sendMessage, uniqueId, waitForAppLoaded } from './helpers';

test.describe('Message Actions', () => {
	test.beforeEach(async ({ page }) => {
		await registerUser(page);
		await waitForAppLoaded(page);
	});

	test('should show action buttons on message hover', async ({ page }) => {
		await navigateToChannel(page, 'general');

		// Send a message
		const message = `actions-${uniqueId()}`;
		await sendMessage(page, message);

		// Hover over the message
		await page.getByText(message).hover();

		// Should see action buttons appear (using actual lucide icon class names)
		await expect(page.locator('.lucide-smile').first()).toBeVisible({ timeout: 5000 });
		await expect(page.locator('.lucide-message-square').first()).toBeVisible({ timeout: 5000 });
		await expect(page.locator('.lucide-bookmark').first()).toBeVisible({ timeout: 5000 });
		await expect(page.locator('.lucide-share').first()).toBeVisible({ timeout: 5000 });
	});

	test('should show emoji button for reactions', async ({ page }) => {
		await navigateToChannel(page, 'general');

		// Send a message
		const message = `emoji-${uniqueId()}`;
		await sendMessage(page, message);

		// Hover over the message
		await page.getByText(message).hover();

		// Emoji/smile button should be visible
		await expect(page.locator('.lucide-smile').first()).toBeVisible({ timeout: 5000 });
	});

	test('should show reply button', async ({ page }) => {
		await navigateToChannel(page, 'general');

		// Send a message
		const message = `reply-${uniqueId()}`;
		await sendMessage(page, message);

		// Hover over the message
		await page.getByText(message).hover();

		// Reply button should be visible
		await expect(page.locator('.lucide-message-square').first()).toBeVisible({ timeout: 5000 });
	});

	test('should show forward/share button', async ({ page }) => {
		await navigateToChannel(page, 'general');

		// Send a message
		const message = `forward-${uniqueId()}`;
		await sendMessage(page, message);

		// Hover over the message
		await page.getByText(message).hover();

		// Forward/share button should be visible
		await expect(page.locator('.lucide-share').first()).toBeVisible({ timeout: 5000 });
	});

	test('should show bookmark button', async ({ page }) => {
		await navigateToChannel(page, 'general');

		// Send a message
		const message = `bookmark-${uniqueId()}`;
		await sendMessage(page, message);

		// Hover over the message
		await page.getByText(message).hover();

		// Bookmark button should be visible
		await expect(page.locator('.lucide-bookmark').first()).toBeVisible({ timeout: 5000 });
	});
});
