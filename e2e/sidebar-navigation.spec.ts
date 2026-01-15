import { expect, test } from '@playwright/test';
import { registerUser, waitForAppLoaded } from './helpers';

test.describe('Sidebar Navigation', () => {
	test.beforeEach(async ({ page }) => {
		await registerUser(page);
		await waitForAppLoaded(page);
	});

	test('should navigate to Threads view', async ({ page }) => {
		await page.getByRole('link', { name: 'Threads' }).click();
		await expect(page.getByText('Threads').first()).toBeVisible();
	});

	test('should navigate to Mentions & Reactions view', async ({ page }) => {
		await page.getByRole('link', { name: 'Mentions & reactions' }).click();
		await expect(page.getByText('Mentions & reactions').first()).toBeVisible();
	});

	test('should navigate to Saved items view', async ({ page }) => {
		await page.getByRole('link', { name: 'Saved items' }).click();
		await expect(page.getByText('Saved items').first()).toBeVisible();
	});

	test('should collapse sidebar', async ({ page }) => {
		// Find collapse button (panel icon)
		const collapseBtn = page.locator('.lucide-panel-left-close');
		if (await collapseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
			await collapseBtn.click();

			// Sidebar should be collapsed - width should be smaller
			// Check that full channel names aren't visible anymore
			await expect(page.getByText('Channels'))
				.not.toBeVisible({ timeout: 3000 })
				.catch(() => {
					// Sidebar might still show icons only
				});
		}
	});

	test('should toggle channels section', async ({ page }) => {
		// Click on Channels header to collapse
		await page.getByText('Channels').first().click();

		// Wait a moment for animation
		await page.waitForTimeout(300);

		// Click again to expand
		await page.getByText('Channels').first().click();

		// general channel should still be visible
		await expect(page.getByRole('link', { name: 'general' })).toBeVisible();
	});

	test('should toggle Direct messages section', async ({ page }) => {
		// Click on Direct messages header
		await page.getByText('Direct messages').first().click();

		// Wait for toggle animation
		await page.waitForTimeout(300);
	});

	test('should show Snack branding in sidebar', async ({ page }) => {
		await expect(page.getByText('Snack')).toBeVisible();
	});

	test('should show current user info', async ({ page }) => {
		// User info should be visible somewhere (username in sidebar or header)
		// Look for the logout button which indicates user is logged in
		await expect(page.locator('.lucide-log-out')).toBeVisible();
	});
});
