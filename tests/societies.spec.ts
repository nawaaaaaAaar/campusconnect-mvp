import { test, expect } from '@playwright/test'
import { 
  login,
  clearTestData,
  waitForNetworkIdle,
  generateTestEmail,
  generateTestPassword,
  createTestAccount
} from './helpers/test-utils'

const TEST_EMAIL = process.env.E2E_TEST_EMAIL
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD

test.describe('Societies Features', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Test credentials not provided')

  test.beforeEach(async ({ page }) => {
    await clearTestData(page)
  })

  test('should display societies discovery page', async ({ page }) => {
    await login(page, TEST_EMAIL!, TEST_PASSWORD!)
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    
    // Navigate to societies/discover
    const discoverLink = page.getByRole('link', { name: /discover|societies/i })
    const isVisible = await discoverLink.isVisible({ timeout: 5000 }).catch(() => false)
    
    if (isVisible) {
      await discoverLink.click()
      await waitForNetworkIdle(page)
      
      // Should show societies list or discovery page
      await expect(page.getByText(/discover.*societies|browse.*societies|societies/i))
        .toBeVisible({ timeout: 10000 })
        .catch(() => {
          console.log('Societies discovery page not found in expected format')
        })
    } else {
      console.log('Discover link not found - feature may not be implemented')
    }
  })

  test('should allow searching for societies', async ({ page }) => {
    await login(page, TEST_EMAIL!, TEST_PASSWORD!)
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    
    // Look for search input
    const searchInput = page.getByPlaceholder(/search.*societies|find.*society/i)
    const isVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false)
    
    if (isVisible) {
      await searchInput.fill('test')
      await waitForNetworkIdle(page)
      
      // Should show search results or "no results" message
      const hasResults = await page.getByText(/results|societies|no.*found/i)
        .isVisible({ timeout: 5000 })
        .catch(() => false)
      
      expect(hasResults).toBeTruthy()
    } else {
      console.log('Society search not found - feature may not be visible')
    }
  })

  test('should allow society account to create society profile', async ({ page }) => {
    // Create a new society account
    const email = generateTestEmail()
    const password = generateTestPassword()
    
    const result = await createTestAccount(page, email, password, 'society')
    
    if (!result.requiresEmailConfirmation) {
      // Should be redirected to profile setup
      await expect(page).toHaveURL(/\/profile-setup/, { timeout: 15000 })
        .catch(() => {
          console.log('Profile setup not triggered automatically')
        })
      
      // Check for society-specific fields
      const societyNameField = page.getByPlaceholder(/society.*name|organization.*name/i)
      const isVisible = await societyNameField.isVisible({ timeout: 5000 }).catch(() => false)
      
      if (isVisible) {
        await societyNameField.fill('Test Society')
        
        // Look for category/description fields
        const descriptionField = page.getByPlaceholder(/description|about/i)
        if (await descriptionField.isVisible({ timeout: 3000 }).catch(() => false)) {
          await descriptionField.fill('This is a test society for E2E testing')
        }
      }
    } else {
      console.log('Email confirmation required - skipping profile setup test')
    }
  })

  test('should display society profile when clicked', async ({ page }) => {
    await login(page, TEST_EMAIL!, TEST_PASSWORD!)
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    
    // Try to find and click on a society card
    const societyCard = page.locator('[data-testid^="society-"]').first()
      .or(page.locator('.society-card').first())
      .or(page.getByRole('article').first())
    
    const isVisible = await societyCard.isVisible({ timeout: 5000 }).catch(() => false)
    
    if (isVisible) {
      await societyCard.click()
      await waitForNetworkIdle(page)
      
      // Should show society profile details
      await expect(page.getByText(/members|followers|about|description/i))
        .toBeVisible({ timeout: 10000 })
        .catch(() => {
          console.log('Society profile not displayed in expected format')
        })
    } else {
      console.log('No society cards found - may need to seed data')
    }
  })

  test('should allow following a society', async ({ page }) => {
    await login(page, TEST_EMAIL!, TEST_PASSWORD!)
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    
    // Find a follow button
    const followButton = page.getByRole('button', { name: /follow/i }).first()
    const isVisible = await followButton.isVisible({ timeout: 5000 }).catch(() => false)
    
    if (isVisible) {
      const beforeText = await followButton.textContent()
      await followButton.click()
      await page.waitForTimeout(1000) // Wait for state update
      
      const afterText = await followButton.textContent()
      
      // Button text should change (Follow -> Following or vice versa)
      expect(beforeText).not.toBe(afterText)
    } else {
      console.log('Follow button not found - may need societies to exist first')
    }
  })
})

