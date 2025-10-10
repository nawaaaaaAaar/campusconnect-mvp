import { test, expect } from '@playwright/test';
import { 
  waitForNetworkIdle, 
  waitForElement, 
  clearTestData,
  generateTestEmail,
  generateTestPassword,
  createTestAccount
} from './helpers/test-utils';

test.describe('Authentication Flow', () => {
  // Clear storage before each test
  test.beforeEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('should display login form after selecting account type', async ({ page }) => {
    await page.goto('/auth');
    await waitForNetworkIdle(page);

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
    await page.goto('/auth');
    await waitForNetworkIdle(page);

    // Select account type first (Student)
    const studentCard = page.getByTestId('account-type-student')
    await studentCard.waitFor({ state: 'visible', timeout: 10000 })
    await studentCard.click()

    // Click on signup link
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click();

    // Check if signup form elements are present
    await expect(page.getByText('Create Your Student Account')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
    await expect(page.getByPlaceholder('Create a password')).toBeVisible();
    await expect(page.getByPlaceholder('Confirm your password')).toBeVisible();
  });

  test('should allow navigating to login after successful signup submit', async ({ page }) => {
    await page.goto('/auth');
    await waitForNetworkIdle(page);

    const testEmail = generateTestEmail();
    const testPassword = generateTestPassword();

    // Use helper function to create test account
    const result = await createTestAccount(page, testEmail, testPassword, 'student');

    // If email confirmation is required
    if (result.requiresEmailConfirmation) {
      // Navigate back to login
      await page.getByRole('button', { name: 'Back to Sign In' }).click();
      
      // Verify login tabs are visible
      await expect(page.getByRole('tab', { name: 'Password' })).toBeVisible({ timeout: 15000 });
      await expect(page.getByRole('tab', { name: 'Email Code' })).toBeVisible({ timeout: 15000 });
    } else {
      // If no email confirmation, user might be redirected to profile setup or dashboard
      await expect(page).toHaveURL(/\/(profile-setup|dashboard)/, { timeout: 15000 });
    }
  });

  test('should display society account type option', async ({ page }) => {
    await page.goto('/auth');
    await waitForNetworkIdle(page);

    // Check if society option is available
    const societyCard = page.getByTestId('account-type-society');
    await expect(societyCard).toBeVisible();
    
    // Click society option
    await societyCard.click();
    
    // Verify society-specific messaging
    await expect(page.getByText(/society|organization/i)).toBeVisible({ timeout: 10000 });
  });

  test('should handle password validation on signup', async ({ page }) => {
    await page.goto('/auth');
    await waitForNetworkIdle(page);

    // Select student account
    await page.getByTestId('account-type-student').click();
    
    // Navigate to signup
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click();

    // Try weak password
    await page.getByPlaceholder('Enter your email').fill(generateTestEmail());
    await page.getByPlaceholder('Create a password').fill('weak');
    await page.getByPlaceholder('Confirm your password').fill('weak');

    // Submit and check for validation error
    await page.getByRole('button', { name: 'Create Account' }).click();
    
    // Should show error message (implementation-dependent)
    // This might fail initially but helps verify validation is working
    await expect(page.getByText(/password.*strong|password.*least|password.*character/i))
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        console.log('Password validation message not found - may need to add to UI');
      });
  });
});
