import { expect, test } from '@playwright/test';
import { navigateToChannel, registerUser, uniqueId, waitForAppLoaded } from './helpers';

test.describe('Channels', () => {
	test.beforeEach(async ({ page }) => {
		await registerUser(page);
		await waitForAppLoaded(page);
	});

	test('should navigate to general channel by default', async ({ page }) => {
		// After login, should see general channel in sidebar
		await expect(page.getByRole('link', { name: 'general' })).toBeVisible();

		// Should be able to navigate to it
		await navigateToChannel(page, 'general');

		// Message input should be visible
		await expect(page.getByPlaceholder(/Message #general/)).toBeVisible();
	});

	test('should open create channel modal', async ({ page }) => {
		// Click the + button next to Channels
		await page.locator('.lucide-plus').first().click();

		// Modal should appear
		await expect(page.getByText('Create a channel')).toBeVisible();
	});

	test('should create a new public channel', async ({ page }) => {
		const channelName = `chan${uniqueId()}`;

		// Click the + button next to Channels
		await page.locator('.lucide-plus').first().click();

		// Modal should appear
		await expect(page.getByText('Create a channel')).toBeVisible();

		// Fill in channel name (the placeholder is "e.g. plan-budget")
		await page.locator('#name').fill(channelName);

		// Submit
		await page.getByRole('button', { name: 'Create' }).click();

		// Channel should now be visible in sidebar
		await expect(page.getByRole('link', { name: channelName })).toBeVisible({ timeout: 10000 });
	});

	test('should have private toggle in create channel modal', async ({ page }) => {
		// Click the + button next to Channels
		await page.locator('.lucide-plus').first().click();

		// Modal should appear
		await expect(page.getByText('Create a channel')).toBeVisible();

		// Private toggle should be visible
		await expect(page.getByText('Make private')).toBeVisible();
		await expect(page.getByLabel('Toggle private')).toBeVisible();
	});

	test('should star a channel', async ({ page }) => {
		// Navigate to general channel
		await navigateToChannel(page, 'general');

		// Click the star button in the chat area header
		await page.locator('.lucide-star').first().click();

		// Channel should now appear in the Starred section
		// Look for the starred section and the channel in it
		await expect(page.getByText('Starred').first()).toBeVisible();
	});

	test('should display channel name in message input', async ({ page }) => {
		// Navigate to general channel
		await navigateToChannel(page, 'general');

		// Verify we're in the general channel
		await expect(page.getByPlaceholder(/Message #general/)).toBeVisible();
	});

	test('should show channel info', async ({ page }) => {
		await navigateToChannel(page, 'general');

		// Click the info button
		await page.locator('.lucide-info').first().click();

		// Should show channel info panel with "Details" header
		await expect(page.getByText('Details')).toBeVisible({ timeout: 5000 });
	});
});
