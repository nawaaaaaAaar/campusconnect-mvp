import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { initSentry } from './lib/sentry'
import { validateEnvironment, logEnvironmentStatus } from './lib/env-validation'
import { initPerformanceMonitoring } from './lib/performance'
import './index.css'
import App from './App.tsx'

// Validate environment variables
try {
  const result = validateEnvironment()
  if (!result.isValid) {
    console.error('Environment validation failed:', result.errors)
  }
  logEnvironmentStatus(result)
} catch (error) {
  console.error('Failed to validate environment:', error)
  // Show user-friendly error
  document.getElementById('root')!.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui;">
      <div style="max-width: 600px; padding: 2rem; border: 2px solid #ef4444; border-radius: 8px; background: #fee;">
        <h1 style="color: #dc2626; margin: 0 0 1rem 0;">⚠️ Configuration Error</h1>
        <p style="margin: 0 0 1rem 0;">The application is not properly configured. Please check your environment variables.</p>
        <pre style="background: white; padding: 1rem; border-radius: 4px; overflow-x: auto;">${error instanceof Error ? error.message : String(error)}</pre>
        <p style="margin: 1rem 0 0 0; font-size: 0.875rem; color: #666;">
          Check the browser console for more details.
        </p>
      </div>
    </div>
  `
  throw error
}

// Initialize Sentry before rendering the app
initSentry()

// Initialize performance monitoring
initPerformanceMonitoring()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
