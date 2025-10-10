# Testing Guide

This document explains how to run and write tests for CampusConnect.

## Test Stack

- **E2E Testing**: Playwright
- **Unit Testing**: Jest + React Testing Library
- **Test Utilities**: Custom helpers in `tests/helpers/test-utils.ts`

## Running Tests

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see the browser)
npx playwright test --headed

# Run specific test file
npx playwright test tests/auth.spec.ts

# Run tests matching a pattern
npx playwright test -g "login"

# Debug tests
npx playwright test --debug
```

### Unit Tests (Jest)

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Test Files

### E2E Test Suites

1. **`auth.spec.ts`** - Authentication flows
   - Account type selection
   - Login/signup forms
   - Password validation
   - Email confirmation flow

2. **`login.spec.ts`** - Login with seeded credentials
   - Password-based login
   - Helper function usage

3. **`dashboard.spec.ts`** - Dashboard features
   - Home feed display
   - Navigation between tabs
   - Post creation
   - User profile menu

4. **`societies.spec.ts`** - Society features
   - Society discovery
   - Search functionality
   - Society profile creation
   - Following societies

### Unit Test Suites

1. **`Header.test.tsx`** - Header component tests

## Test Utilities

Located in `tests/helpers/test-utils.ts`:

### Authentication Helpers
- `login(page, email, password)` - Complete login flow
- `logout(page)` - Logout flow
- `createTestAccount(page, email, password, accountType)` - Signup flow
- `waitForAuth(page, timeout)` - Wait for auth to complete
- `isAuthenticated(page)` - Check if user is logged in

### Data Helpers
- `generateTestEmail()` - Generate unique test email
- `generateTestPassword()` - Generate test password
- `clearTestData(page)` - Clear localStorage/sessionStorage

### UI Helpers
- `waitForNetworkIdle(page, timeout)` - Wait for network requests
- `waitForElement(page, selector, options)` - Wait for element
- `waitForToast(page, message, timeout)` - Wait for toast message
- `fillField(page, label, value)` - Fill form field safely

### Debugging Helpers
- `screenshotOnFailure(page, testName)` - Capture screenshot
- `assertNoConsoleErrors(page)` - Check for console errors
- `mockApiResponse(page, url, response, status)` - Mock API calls

## Environment Variables

For E2E tests with seeded users, set:

```bash
# .env.test or .env.local
E2E_TEST_EMAIL=test@example.com
E2E_TEST_PASSWORD=YourTestPassword123!
```

Tests requiring these credentials will be skipped if not provided.

## Writing New Tests

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test'
import { login, clearTestData, waitForNetworkIdle } from './helpers/test-utils'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await clearTestData(page)
    // Add any setup needed
  })

  test('should do something', async ({ page }) => {
    await page.goto('/some-route')
    await waitForNetworkIdle(page)
    
    // Your test logic
    await expect(page.getByText('Expected Text')).toBeVisible()
  })
})
```

### Unit Test Template

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YourComponent } from './YourComponent'

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('should handle user interaction', async () => {
    const user = userEvent.setup()
    render(<YourComponent />)
    
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Result')).toBeInTheDocument()
  })
})
```

## Best Practices

### 1. Test Isolation
- Clear storage before each test
- Don't rely on test execution order
- Clean up created data after tests

### 2. Selectors Priority
1. `getByRole()` - Most accessible
2. `getByLabelText()` - For forms
3. `getByPlaceholderText()` - For inputs
4. `getByTestId()` - Last resort

### 3. Waiting Strategies
- Use `waitForNetworkIdle()` after navigation
- Use `toBeVisible({ timeout })` for async elements
- Avoid `page.waitForTimeout()` unless absolutely necessary

### 4. Error Handling
```typescript
// Graceful failure for optional features
const optionalElement = page.getByText('Optional')
const isVisible = await optionalElement.isVisible({ timeout: 3000 }).catch(() => false)

if (isVisible) {
  // Test the feature
} else {
  console.log('Feature not implemented - skipping')
}
```

### 5. Test Data
- Use `generateTestEmail()` and `generateTestPassword()` for unique data
- Don't hardcode test data that could conflict
- Clean up test data after tests complete

## Continuous Integration

Tests run automatically on:
- Pull requests to `main`
- Pushes to `main`
- Nightly builds

See `.github/workflows/ci-cd.yml` for CI configuration.

## Debugging Failed Tests

### 1. Run with UI Mode
```bash
npm run test:e2e:ui
```

### 2. Check Screenshots
Failed tests automatically capture screenshots in `test-results/`

### 3. Use Debug Mode
```bash
npx playwright test --debug
```

### 4. Check Playwright Report
```bash
npx playwright show-report
```

### 5. Run Single Test
```bash
npx playwright test tests/auth.spec.ts -g "should display login form"
```

## Common Issues

### Issue: Tests timing out
**Solution**: Increase timeout in `playwright.config.ts` or use longer timeout for specific assertions:
```typescript
await expect(element).toBeVisible({ timeout: 15000 })
```

### Issue: Element not found
**Solution**: 
1. Check if page has loaded: `await waitForNetworkIdle(page)`
2. Check selector is correct
3. Check if element is in shadow DOM or iframe

### Issue: Authentication failing
**Solution**:
1. Verify environment variables are set
2. Check Supabase configuration
3. Ensure database is migrated
4. Check network tab in browser

### Issue: Flaky tests
**Solution**:
1. Add proper waits (`waitForNetworkIdle`, `toBeVisible`)
2. Don't use `waitForTimeout` 
3. Ensure test isolation
4. Check for race conditions

## Test Coverage Goals

- **E2E Coverage**: All critical user flows
  - ✅ Authentication (signup, login, OAuth)
  - ✅ Dashboard navigation
  - ✅ Society discovery and interaction
  - ⏳ Post creation and interaction
  - ⏳ Notifications
  - ⏳ Profile management

- **Unit Coverage**: All components and utilities
  - ✅ Security utilities
  - ✅ Validation functions
  - ⏳ React components (>80% coverage goal)
  - ⏳ Custom hooks

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Best Practices for E2E Testing](https://playwright.dev/docs/best-practices)

