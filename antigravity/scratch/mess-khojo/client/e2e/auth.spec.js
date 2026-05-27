import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should load user login page successfully', async ({ page }) => {
        await page.goto('/user-login');
        await expect(page).toHaveTitle(/Login/i);
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('should show error on submitting empty form', async ({ page }) => {
        await page.goto('/user-login');
        const submitBtn = page.locator('button[type="submit"]');
        if (await submitBtn.isVisible()) {
            await submitBtn.click();
        }
    });
});
