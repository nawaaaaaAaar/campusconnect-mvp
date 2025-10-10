/**
 * Test Utilities for E2E Tests
 * Provides helper functions for common test scenarios
 */

import { Page, expect } from '@playwright/test'

/**
 * Wait for authentication to complete
 */
export async function waitForAuth(page: Page, timeout = 10000) {
  await page.waitForFunction(
    () => {
      const storage = localStorage.getItem('supabase.auth.token')
      return storage !== null
    },
    { timeout }
  )
}

/**
 * Login with test credentials
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/auth')
  
  // Wait for account type selection
  const studentCard = page.getByTestId('account-type-student')
  await studentCard.waitFor({ state: 'visible', timeout: 10000 })
  await studentCard.click()
  
  // Fill login form
  await page.getByPlaceholder('Enter your email').fill(email)
  await page.getByPlaceholder('Enter your password').fill(password)
  
  // Submit
  await page.getByRole('button', { name: 'Sign In' }).click()
  
  // Wait for navigation
  await page.waitForURL(/\/(dashboard|profile-setup)/, { timeout: 15000 })
}

/**
 * Logout user
 */
export async function logout(page: Page) {
  // Click user menu
  await page.getByRole('button', { name: /user menu|profile/i }).click()
  
  // Click logout
  await page.getByRole('menuitem', { name: /logout|sign out/i }).click()
  
  // Wait for redirect to auth
  await page.waitForURL('/auth', { timeout: 10000 })
}

/**
 * Create a test account
 */
export async function createTestAccount(
  page: Page,
  email: string,
  password: string,
  accountType: 'student' | 'society' = 'student'
) {
  await page.goto('/auth')
  
  // Select account type
  const accountCard = page.getByTestId(`account-type-${accountType}`)
  await accountCard.waitFor({ state: 'visible', timeout: 10000 })
  await accountCard.click()
  
  // Click signup
  await page.getByRole('button', { name: /don't have an account/i }).click()
  
  // Fill signup form
  await page.getByPlaceholder('Enter your email').fill(email)
  await page.getByPlaceholder('Create a password').fill(password)
  await page.getByPlaceholder('Confirm your password').fill(password)
  
  // Submit
  await page.getByRole('button', { name: 'Create Account' }).click()
  
  // Handle email confirmation message if present
  const backToSignIn = page.getByRole('button', { name: 'Back to Sign In' })
  if (await backToSignIn.isVisible({ timeout: 3000 }).catch(() => false)) {
    return { requiresEmailConfirmation: true }
  }
  
  return { requiresEmailConfirmation: false }
}

/**
 * Wait for element with retry
 */
export async function waitForElement(
  page: Page,
  selector: string,
  options = { timeout: 10000, visible: true }
) {
  await page.waitForSelector(selector, {
    state: options.visible ? 'visible' : 'attached',
    timeout: options.timeout
  })
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    const storage = localStorage.getItem('supabase.auth.token')
    return storage !== null
  })
}

/**
 * Clear test data
 */
export async function clearTestData(page: Page) {
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

/**
 * Mock API response
 */
export async function mockApiResponse(
  page: Page,
  url: string,
  response: any,
  status = 200
) {
  await page.route(url, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response)
    })
  })
}

/**
 * Wait for network idle
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout })
}

/**
 * Take screenshot on failure
 */
export async function screenshotOnFailure(page: Page, testName: string) {
  await page.screenshot({
    path: `test-results/failures/${testName}-${Date.now()}.png`,
    fullPage: true
  })
}

/**
 * Generate random email
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}@example.com`
}

/**
 * Generate random password
 */
export function generateTestPassword(): string {
  return `Test123!${Date.now()}`
}

/**
 * Assert no console errors
 */
export async function assertNoConsoleErrors(page: Page) {
  const errors: string[] = []
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  
  // Check after test
  if (errors.length > 0) {
    console.warn('Console errors detected:', errors)
  }
}

/**
 * Wait for toast message
 */
export async function waitForToast(page: Page, message: string, timeout = 5000) {
  await expect(page.getByText(message)).toBeVisible({ timeout })
}

/**
 * Fill form field safely
 */
export async function fillField(page: Page, label: string, value: string) {
  const field = page.getByLabel(label).or(page.getByPlaceholder(label))
  await field.waitFor({ state: 'visible', timeout: 5000 })
  await field.fill(value)
}

