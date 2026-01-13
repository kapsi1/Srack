import { test, expect } from '@playwright/test';
const TEST_PREFIX = 'test__';

test.describe('Messaging', () => {
    test.beforeEach(async ({ page }) => {
        // Register a user for each test to have clean state
        await page.goto('/');
        
        await page.getByText("Don't have an account? Sign up").click();
        
        const uniqueId = Date.now();
        await page.fill('#username', `${TEST_PREFIX}msg_user_${uniqueId}`);
        await page.fill('#email', `${TEST_PREFIX}msg_${uniqueId}@example.com`);
        await page.fill('#password', 'password123');
        await page.getByRole('button', { name: 'Create Account' }).click();
        await expect(page.getByText('Workspace Name')).toBeVisible();
    });

    test('send a message', async ({ page }) => {
        // Should be in general channel by default or first channel
        // Wait for channel to load
        await expect(page.getByPlaceholder(/Message #/)).toBeVisible();
        
        const message = `Hello World ${Date.now()}`;
        await page.getByPlaceholder(/Message #/).fill(message);
        await page.keyboard.press('Enter');
        
        // Expect message to appear in list
        // It might appear optimistically or after ack.
        await expect(page.getByText(message)).toBeVisible();
    });
});
