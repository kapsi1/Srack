import { type Page, expect } from '@playwright/test';

export const TEST_PREFIX = 'test__';

/**
 * Generate a unique ID for test data
 */
export const uniqueId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

/**
 * Register a new user and return credentials
 */
export async function registerUser(page: Page, prefix = 'user') {
	const id = uniqueId();
	const username = `${TEST_PREFIX}${prefix}_${id}`;
	const email = `${TEST_PREFIX}${prefix}_${id}@example.com`;
	const password = 'password123';

	await page.goto('/');
	await page.getByText("Don't have an account? Sign up").click();
	await page.fill('#username', username);
	await page.fill('#email', email);
	await page.fill('#password', password);
	await page.getByRole('button', { name: 'Create Account' }).click();

	// Wait for successful login - should see Snack in sidebar
	await expect(page.getByText('Snack')).toBeVisible({ timeout: 30000 });

	return { username, email, password };
}

/**
 * Login with existing credentials
 */
export async function loginUser(page: Page, email: string, password: string) {
	await page.goto('/');
	await page.fill('#email', email);
	await page.fill('#password', password);
	await page.getByRole('button', { name: 'Sign In' }).click();

	// Wait for successful login
	await expect(page.getByText('Snack')).toBeVisible({ timeout: 30000 });
}

/**
 * Logout current user
 */
export async function logoutUser(page: Page) {
	await page.locator('.lucide-log-out').first().click();
	await expect(page.getByText('Welcome to Snack')).toBeVisible({ timeout: 10000 });
}

/**
 * Send a message in the current channel
 */
export async function sendMessage(page: Page, content: string) {
	const messageInput = page.getByPlaceholder(/Message #|Message @/);
	await expect(messageInput).toBeVisible({ timeout: 10000 });
	await messageInput.fill(content);
	await page.keyboard.press('Enter');
	// Wait for message to appear
	await expect(page.getByText(content)).toBeVisible({ timeout: 10000 });
}

/**
 * Navigate to a channel by name
 */
export async function navigateToChannel(page: Page, channelName: string) {
	await page.getByRole('link', { name: channelName }).first().click();
	// Wait for channel to load - message input should show channel name
	await expect(page.getByPlaceholder(new RegExp(`Message #${channelName}`))).toBeVisible({ timeout: 10000 });
}

/**
 * Wait for the app to be fully loaded
 */
export async function waitForAppLoaded(page: Page) {
	await expect(page.getByText('Snack')).toBeVisible({ timeout: 30000 });
	// Wait for channels to load
	await expect(page.getByRole('link', { name: 'general' })).toBeVisible({ timeout: 10000 });
}
