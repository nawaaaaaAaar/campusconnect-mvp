import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.E2E_TEST_EMAIL
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD

test.describe('Password login with seeded user', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Seeded credentials not provided')

  test('logs in with seeded student account', async ({ page }) => {
    await page.goto('/auth')

    // Select Student account type
    await page.getByText('Student').click()

    // Ensure password tab is active
    await page.getByRole('tab', { name: 'Password' }).click()

    await page.getByPlaceholder('Enter your email').fill(TEST_EMAIL!)
    await page.getByPlaceholder('Enter your password').fill(TEST_PASSWORD!)

    await page.getByRole('button', { name: 'Sign In' }).click()

    // Expect redirect to profile setup or dashboard depending on profile state
    await expect(page).toHaveURL(/\/profile-setup|\/dashboard/, { timeout: 20000 })
  })
})







