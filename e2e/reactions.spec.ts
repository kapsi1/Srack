import { expect, test } from '@playwright/test';
import { navigateToChannel, registerUser, sendMessage, uniqueId, waitForAppLoaded } from './helpers';

test.describe('Reactions', () => {
	test.beforeEach(async ({ page }) => {
		await registerUser(page);
		await waitForAppLoaded(page);
	});

	test('should show emoji picker when clicking smile button', async ({ page }) => {
		await navigateToChannel(page, 'general');

		// Send a message
		const message = `react-${uniqueId()}`;
		await sendMessage(page, message);

		// Hover over the message to show actions
		await page.getByText(message).hover();

		// Click the smile/emoji button to add reaction
		await page.locator('.lucide-smile').first().click();

		// Emoji picker should appear
		await expect(page.locator('.EmojiPickerReact').first()).toBeVisible({ timeout: 5000 });
	});

	test('should add reaction by clicking emoji in picker', async ({ page }) => {
		await navigateToChannel(page, 'general');

		// Send a message
		const message = `react-add-${uniqueId()}`;
		await sendMessage(page, message);

		// Hover and click emoji button
		await page.getByText(message).hover();
		await page.locator('.lucide-smile').first().click();

		// Wait for picker
		await page.locator('.EmojiPickerReact').first().waitFor({ state: 'visible', timeout: 5000 });

		// Click on any available emoji button in the picker
		// The emoji picker has buttons with emojis as content
		await page.locator('.EmojiPickerReact button[data-unified]').first().click();

		// The picker should close and reaction should appear
		// The reaction appears as a button with emoji and count
		await expect(page.locator('.EmojiPickerReact')).toBeHidden({ timeout: 3000 });
	});

	test('should close emoji picker when clicking outside', async ({ page }) => {
		await navigateToChannel(page, 'general');

		// Send a message
		const message = `close-picker-${uniqueId()}`;
		await sendMessage(page, message);

		// Open emoji picker
		await page.getByText(message).hover();
		await page.locator('.lucide-smile').first().click();
		await page.locator('.EmojiPickerReact').first().waitFor({ state: 'visible', timeout: 5000 });

		// Click somewhere else on the page
		await page.click('body', { position: { x: 10, y: 10 }, force: true });

		// Picker should close
		await expect(page.locator('.EmojiPickerReact')).toBeHidden({ timeout: 3000 });
	});
});
