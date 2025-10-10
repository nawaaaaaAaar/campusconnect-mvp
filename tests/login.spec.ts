import { test, expect } from '@playwright/test'
import { 
  login, 
  clearTestData, 
  waitForNetworkIdle,
  isAuthenticated,
  waitForAuth
} from './helpers/test-utils'

const TEST_EMAIL = process.env.E2E_TEST_EMAIL
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD

test.describe('Password login with seeded user', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Seeded credentials not provided')

  test.beforeEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('logs in with seeded student account', async ({ page }) => {
    await page.goto('/auth')
    await waitForNetworkIdle(page);

    // Select Student account type
    const studentCard = page.getByTestId('account-type-student').or(page.getByText('Student'))
    await studentCard.waitFor({ state: 'visible', timeout: 10000 });
    await studentCard.click()

    // Ensure password tab is active
    await page.getByRole('tab', { name: 'Password' }).click()

    await page.getByPlaceholder('Enter your email').fill(TEST_EMAIL!)
    await page.getByPlaceholder('Enter your password').fill(TEST_PASSWORD!)

    await page.getByRole('button', { name: 'Sign In' }).click()

    // Expect redirect to profile setup or dashboard depending on profile state
    await expect(page).toHaveURL(/\/profile-setup|\/dashboard/, { timeout: 20000 })
    
    // Verify user is authenticated
    const authenticated = await isAuthenticated(page);
    expect(authenticated).toBe(true);
  })

  test('logs in using helper function', async ({ page }) => {
    await login(page, TEST_EMAIL!, TEST_PASSWORD!);
    
    // Should be on dashboard or profile setup
    await expect(page).toHaveURL(/\/profile-setup|\/dashboard/, { timeout: 20000 });
    
    // Verify authentication
    await waitForAuth(page);
    const authenticated = await isAuthenticated(page);
    expect(authenticated).toBe(true);
  });
})







