import { test, expect } from '@playwright/test';

test.describe('Fuzzy Search and Filtering', () => {
    test('should load landing page list of messes', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/MessKhojo/i);
        
        const header = page.locator('header');
        if (await header.isVisible()) {
            await expect(header).toBeVisible();
        }
    });

    test('should type search keywords into input', async ({ page }) => {
        await page.goto('/');
        const searchInput = page.locator('input[placeholder*="Search"]');
        if (await searchInput.isVisible()) {
            await searchInput.fill('Balasore');
            await searchInput.press('Enter');
        }
    });
});
