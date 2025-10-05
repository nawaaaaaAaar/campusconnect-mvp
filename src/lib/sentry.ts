/**
 * Sentry configuration for CampusConnect
 * Provides error tracking and performance monitoring
 */

import * as Sentry from '@sentry/react'

// Initialize Sentry
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  
  if (!dsn) {
    console.warn('Sentry DSN not provided. Error tracking disabled.')
    return
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration({
        // Set tracing origins to capture performance data
        tracingOrigins: [
          'localhost',
          '127.0.0.1',
          /^https:\/\/.*\.supabase\.co/,
          /^https:\/\/.*\.supabase\.in/,
          /^https:\/\/firebase\.googleapis\.com/,
          /^https:\/\/fcm\.googleapis\.com/,
        ],
      }),
    ],
    // Performance monitoring
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    // Error sampling
    sampleRate: 1.0,
    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    // User context
    beforeSend(event) {
      // Filter out non-critical errors in production
      if (import.meta.env.MODE === 'production') {
        // Don't send network errors for external services
        if (event.exception) {
          const error = event.exception.values?.[0]
          if (error?.type === 'NetworkError' && error.value?.includes('supabase')) {
            return null
          }
        }
      }
      return event
    },
    // Custom tags
    initialScope: {
      tags: {
        component: 'campusconnect',
        platform: 'web',
      },
    },
  })

  // Set user context when available
  Sentry.setUser({
    id: undefined, // Will be set when user logs in
    email: undefined,
  })

  console.log('Sentry initialized successfully')
}

// Set user context for error tracking
export function setSentryUser(user: { id: string; email: string; account_type?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.email.split('@')[0],
  })

  Sentry.setTag('account_type', user.account_type)
  Sentry.setContext('user', {
    account_type: user.account_type,
    login_time: new Date().toISOString(),
  })
}

// Clear user context on logout
export function clearSentryUser() {
  Sentry.setUser(null)
  Sentry.setTag('account_type', undefined)
  Sentry.setContext('user', null)
}

// Custom error reporting
export function reportError(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value)
      })
    }
    Sentry.captureException(error)
  })
}

// Performance monitoring
export function startTransaction(name: string, op: string = 'navigation') {
  return Sentry.startSpan({
    name,
    op,
  })
}

// Breadcrumb tracking
export function addBreadcrumb(message: string, category: string = 'user', level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  })
}

// Custom performance metrics
export function trackPerformance(name: string, value: number, unit: string = 'ms') {
  Sentry.addBreadcrumb({
    message: `Performance: ${name}`,
    category: 'performance',
    level: 'info',
    data: {
      value,
      unit,
    },
  })
}

// API error tracking
export function trackApiError(endpoint: string, status: number, error: string) {
  Sentry.addBreadcrumb({
    message: `API Error: ${endpoint}`,
    category: 'api',
    level: 'error',
    data: {
      endpoint,
      status,
      error,
    },
  })
}

// User action tracking
export function trackUserAction(action: string, component: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message: `User Action: ${action}`,
    category: 'user_action',
    level: 'info',
    data: {
      action,
      component,
      ...data,
    },
  })
}

// Navigation tracking
export function trackNavigation(from: string, to: string) {
  Sentry.addBreadcrumb({
    message: `Navigation: ${from} -> ${to}`,
    category: 'navigation',
    level: 'info',
    data: {
      from,
      to,
    },
  })
}

// Feature usage tracking
export function trackFeatureUsage(feature: string, action: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message: `Feature Usage: ${feature} - ${action}`,
    category: 'feature',
    level: 'info',
    data: {
      feature,
      action,
      ...data,
    },
  })
}

// Error boundary integration
export function captureErrorBoundaryError(error: Error, errorInfo: any) {
  Sentry.withScope((scope) => {
    scope.setTag('errorBoundary', true)
    scope.setContext('errorInfo', errorInfo)
    Sentry.captureException(error)
  })
}

// Network error tracking
export function trackNetworkError(url: string, method: string, status: number, error: string) {
  Sentry.addBreadcrumb({
    message: `Network Error: ${method} ${url}`,
    category: 'network',
    level: 'error',
    data: {
      url,
      method,
      status,
      error,
    },
  })
}

// Export Sentry instance for direct use
export { Sentry }
