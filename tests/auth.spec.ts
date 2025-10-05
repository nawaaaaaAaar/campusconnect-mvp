import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login form after selecting account type', async ({ page }) => {
    await page.goto('/auth');

    // Select account type first (Student)
    await page.getByText('Student').click();

    // Check if login form elements are present
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByText('Sign in to your Student account')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should display signup form when toggled', async ({ page }) => {
    await page.goto('/auth');

    // Select account type first (Student)
    await page.getByText('Student').click();

    // Click on signup link
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click();

    // Check if signup form elements are present
    await expect(page.getByText('Create Your Student Account')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
    await expect(page.getByPlaceholder('Create a password')).toBeVisible();
    await expect(page.getByPlaceholder('Confirm your password')).toBeVisible();
  });

  test('should return to login after successful signup submit', async ({ page }) => {
    await page.goto('/auth');

    // Select account type first (Student)
    await page.getByText('Student').click();

    // Navigate to signup
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click();

    // Fill signup form
    await page.getByPlaceholder('Enter your email').fill('test@example.com');
    await page.getByPlaceholder('Create a password').fill('password123');
    await page.getByPlaceholder('Confirm your password').fill('password123');

    // Submit form
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Should show login form afterwards (wait for tab triggers as stable selectors)
    await expect(page.getByRole('tab', { name: 'Password' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('tab', { name: 'Email Code' })).toBeVisible({ timeout: 15000 });
  });
});
