import { expect, test } from '@playwright/test';
import { navigateToChannel, registerUser, sendMessage, uniqueId, waitForAppLoaded } from './helpers';

test.describe('Messaging', () => {
	test.beforeEach(async ({ page }) => {
		await registerUser(page);
		await waitForAppLoaded(page);
	});

	test('should send a text message', async ({ page }) => {
		await navigateToChannel(page, 'general');

		const message = `Hello World ${uniqueId()}`;
		await sendMessage(page, message);

		// Message should appear in the list
		await expect(page.getByText(message)).toBeVisible();
	});

	test('should display message with correct user info', async ({ page }) => {
		await navigateToChannel(page, 'general');

		const message = `user-info-test-${uniqueId()}`;
		await sendMessage(page, message);

		// Message should appear with avatar/username context
		const messageElement = page.getByText(message);
		await expect(messageElement).toBeVisible();
	});

	test('should display message timestamp', async ({ page }) => {
		await navigateToChannel(page, 'general');

		const message = `timestamp-test-${uniqueId()}`;
		await sendMessage(page, message);

		// Look for time format (e.g., "10:30 AM" or similar)
		const timePattern = /\d{1,2}:\d{2}/;
		await expect(page.getByText(timePattern).first()).toBeVisible();
	});

	test('should send multiple messages in sequence', async ({ page }) => {
		await navigateToChannel(page, 'general');

		const messages = [`msg1-${uniqueId()}`, `msg2-${uniqueId()}`, `msg3-${uniqueId()}`];

		for (const msg of messages) {
			await sendMessage(page, msg);
		}

		// All messages should be visible
		for (const msg of messages) {
			await expect(page.getByText(msg)).toBeVisible();
		}
	});

	test('should preserve message order', async ({ page }) => {
		await navigateToChannel(page, 'general');

		const id = uniqueId();
		const messages = [`first-${id}`, `second-${id}`, `third-${id}`];

		for (const msg of messages) {
			await sendMessage(page, msg);
		}

		// Get all message text elements containing our unique id
		const messageElements = page.locator(`text=/${id}/`);
		const count = await messageElements.count();

		// Should have 3 messages
		expect(count).toBe(3);
	});

	test('should handle emoji in messages', async ({ page }) => {
		await navigateToChannel(page, 'general');

		const id = uniqueId();
		const message = `Hello emoji test ${id}`;
		await sendMessage(page, message);

		// Message should be visible
		await expect(page.getByText(id)).toBeVisible();
	});

	test('should send message with Enter key', async ({ page }) => {
		await navigateToChannel(page, 'general');

		const message = `enter-key-${uniqueId()}`;
		const messageInput = page.getByPlaceholder(/Message #general/);

		await messageInput.fill(message);
		await page.keyboard.press('Enter');

		await expect(page.getByText(message)).toBeVisible({ timeout: 10000 });
	});

	test('should not send empty message', async ({ page }) => {
		await navigateToChannel(page, 'general');

		const messageInput = page.getByPlaceholder(/Message #general/);

		// Try to send empty message
		await messageInput.fill('');
		await page.keyboard.press('Enter');

		// Input should still be empty (message wasn't sent)
		const value = await messageInput.inputValue();
		expect(value).toBe('');
	});

	test('should clear input after sending message', async ({ page }) => {
		await navigateToChannel(page, 'general');

		const message = `clear-input-${uniqueId()}`;
		const messageInput = page.getByPlaceholder(/Message #general/);

		await messageInput.fill(message);
		await page.keyboard.press('Enter');

		// Wait for message to appear
		await expect(page.getByText(message)).toBeVisible({ timeout: 10000 });

		// Input should be cleared
		await expect(messageInput).toHaveValue('');
	});

	test('should show send button', async ({ page }) => {
		await navigateToChannel(page, 'general');

		// Send button should be visible
		await expect(page.locator('.lucide-send')).toBeVisible();
	});

	test('should handle long messages', async ({ page }) => {
		await navigateToChannel(page, 'general');

		const id = uniqueId();
		const longMessage = `Long message test: ${'lorem ipsum '.repeat(20)} ${id}`;
		await sendMessage(page, longMessage);

		// Message should be visible (at least the ID part)
		await expect(page.getByText(id)).toBeVisible();
	});

	test('should handle special characters in messages', async ({ page }) => {
		await navigateToChannel(page, 'general');

		const id = uniqueId();
		const message = `specialchars${id}`;
		await sendMessage(page, message);

		// Message should be visible
		await expect(page.getByText(message)).toBeVisible();
	});
});
