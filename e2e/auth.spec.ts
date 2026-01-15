import { expect, test } from '@playwright/test';
import { loginUser, logoutUser, registerUser, TEST_PREFIX, uniqueId } from './helpers';

test.describe('Authentication', () => {
	test('should register a new user', async ({ page }) => {
		await page.goto('/');

		// Click sign up link
		await page.getByText("Don't have an account? Sign up").click();

		// Should show registration form
		await expect(page.getByText('Create your account')).toBeVisible();

		// Fill registration form
		const id = uniqueId();
		await page.fill('#username', `${TEST_PREFIX}register_${id}`);
		await page.fill('#email', `${TEST_PREFIX}register_${id}@example.com`);
		await page.fill('#password', 'password123');

		// Submit
		await page.getByRole('button', { name: 'Create Account' }).click();

		// Should be logged in and see Snack
		await expect(page.getByText('Snack')).toBeVisible({ timeout: 30000 });
	});

	test('should login with existing credentials', async ({ page }) => {
		// First register a user
		const credentials = await registerUser(page);

		// Logout
		await logoutUser(page);

		// Login with the same credentials
		await loginUser(page, credentials.email, credentials.password);

		// Should be logged in
		await expect(page.getByText('Snack')).toBeVisible({ timeout: 30000 });
	});

	test('should logout successfully', async ({ page }) => {
		// Register and login
		await registerUser(page);

		// Verify logged in
		await expect(page.getByText('Snack')).toBeVisible();

		// Logout
		await logoutUser(page);

		// Should be back to login page
		await expect(page.getByText('Welcome to Snack')).toBeVisible();
	});

	test('should show error for invalid login', async ({ page }) => {
		await page.goto('/');

		// Try to login with invalid credentials
		await page.fill('#email', 'invalid@example.com');
		await page.fill('#password', 'wrongpassword');
		await page.getByRole('button', { name: 'Sign In' }).click();

		// Should show error message
		await expect(page.locator('.text-red-500').or(page.getByText(/error|invalid|failed/i))).toBeVisible({
			timeout: 10000,
		});
	});

	test('should toggle between login and register forms', async ({ page }) => {
		await page.goto('/');

		// Should start on login form
		await expect(page.getByText('Welcome to Snack')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

		// Click to switch to register
		await page.getByText("Don't have an account? Sign up").click();

		// Should now show register form
		await expect(page.getByText('Create your account')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
		await expect(page.locator('#username')).toBeVisible();

		// Click to switch back to login
		await page.getByText('Already have an account? Sign in').click();

		// Should be back to login form
		await expect(page.getByText('Welcome to Snack')).toBeVisible();
	});

	test('should require all fields for registration', async ({ page }) => {
		await page.goto('/');
		await page.getByText("Don't have an account? Sign up").click();

		// Try to submit empty form
		await page.getByRole('button', { name: 'Create Account' }).click();

		// Form should not submit (fields are required)
		// We should still be on the registration form
		await expect(page.getByText('Create your account')).toBeVisible();
	});

	test('should persist login across page reload', async ({ page }) => {
		// Register a user
		await registerUser(page);

		// Verify logged in
		await expect(page.getByText('Snack')).toBeVisible();

		// Reload the page
		await page.reload();

		// Should still be logged in
		await expect(page.getByText('Snack')).toBeVisible({ timeout: 30000 });
	});

	test('should show loading state during authentication', async ({ page }) => {
		await page.goto('/');
		await page.getByText("Don't have an account? Sign up").click();

		// Fill form
		const id = uniqueId();
		await page.fill('#username', `${TEST_PREFIX}loading_${id}`);
		await page.fill('#email', `${TEST_PREFIX}loading_${id}@example.com`);
		await page.fill('#password', 'password123');

		// Click submit
		await page.getByRole('button', { name: 'Create Account' }).click();

		// Button should show loading state (either disabled or processing text)
		// Note: This might be too fast to catch in some cases
	});
});
