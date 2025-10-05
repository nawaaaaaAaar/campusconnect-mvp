import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login form after selecting account type', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'networkidle' });

    // Select account type first (Student)
    const studentCard = page.getByTestId('account-type-student')
    await studentCard.waitFor({ state: 'visible', timeout: 10000 })
    await studentCard.click()

    // Check if login form elements are present
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByText('Sign in to your Student account')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should display signup form when toggled', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'networkidle' });

    // Select account type first (Student)
    const studentCard2 = page.getByTestId('account-type-student')
    await studentCard2.waitFor({ state: 'visible', timeout: 10000 })
    await studentCard2.click()

    // Click on signup link
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click();

    // Check if signup form elements are present
    await expect(page.getByText('Create Your Student Account')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
    await expect(page.getByPlaceholder('Create a password')).toBeVisible();
    await expect(page.getByPlaceholder('Confirm your password')).toBeVisible();
  });

  test('should allow navigating to login after successful signup submit', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'networkidle' });

    // Select account type first (Student)
    const studentCard3 = page.getByTestId('account-type-student')
    await studentCard3.waitFor({ state: 'visible', timeout: 10000 })
    await studentCard3.click()

    // Navigate to signup
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click();

    // Fill signup form
    await page.getByPlaceholder('Enter your email').fill('test@example.com');
    await page.getByPlaceholder('Create a password').fill('password123');
    await page.getByPlaceholder('Confirm your password').fill('password123');

    // Submit form
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Some backends require email confirmation. If still on signup, expect Back to Sign In and navigate.
    const backToSignIn = page.getByRole('button', { name: 'Back to Sign In' })
    if (await backToSignIn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await backToSignIn.click()
    }

    // Then verify login tabs are visible
    await expect(page.getByRole('tab', { name: 'Password' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('tab', { name: 'Email Code' })).toBeVisible({ timeout: 15000 })
  });
});
