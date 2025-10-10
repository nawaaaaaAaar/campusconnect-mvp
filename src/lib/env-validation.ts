/**
 * Environment Variable Validation
 * Ensures all required environment variables are present and valid
 */

interface EnvConfig {
  // Supabase
  VITE_SUPABASE_URL: string
  VITE_SUPABASE_ANON_KEY: string
  
  // Firebase (optional for notifications)
  VITE_FIREBASE_API_KEY?: string
  VITE_FIREBASE_AUTH_DOMAIN?: string
  VITE_FIREBASE_PROJECT_ID?: string
  VITE_FIREBASE_MESSAGING_SENDER_ID?: string
  VITE_FIREBASE_APP_ID?: string
  VITE_FIREBASE_STORAGE_BUCKET?: string
  
  // Sentry (optional for error tracking)
  VITE_SENTRY_DSN?: string
  
  // App metadata
  VITE_APP_VERSION?: string
  VITE_APP_NAME?: string
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  config?: EnvConfig
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Required variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  // Validate Supabase URL
  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is required')
  } else if (!isValidUrl(supabaseUrl)) {
    errors.push('VITE_SUPABASE_URL must be a valid URL')
  } else if (!supabaseUrl.includes('.supabase.co') && !supabaseUrl.includes('localhost')) {
    warnings.push('VITE_SUPABASE_URL does not appear to be a valid Supabase URL')
  }
  
  // Validate Supabase anon key
  if (!supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required')
  } else if (supabaseAnonKey.length < 100) {
    errors.push('VITE_SUPABASE_ANON_KEY appears to be invalid (too short)')
  }
  
  // Check Firebase configuration (optional but warn if partial)
  const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY
  const firebaseProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
  const firebaseAppId = import.meta.env.VITE_FIREBASE_APP_ID
  
  const hasAnyFirebaseConfig = firebaseApiKey || firebaseProjectId || firebaseAppId
  const hasCompleteFirebaseConfig = firebaseApiKey && firebaseProjectId && firebaseAppId
  
  if (hasAnyFirebaseConfig && !hasCompleteFirebaseConfig) {
    warnings.push('Firebase configuration is incomplete. Push notifications will not work. Required: VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID')
  }
  
  // Check Sentry DSN
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN
  if (sentryDsn && !isValidUrl(sentryDsn)) {
    warnings.push('VITE_SENTRY_DSN is set but appears to be invalid')
  }
  
  // Check app metadata
  if (!import.meta.env.VITE_APP_VERSION) {
    warnings.push('VITE_APP_VERSION is not set')
  }
  
  if (!import.meta.env.VITE_APP_NAME) {
    warnings.push('VITE_APP_NAME is not set')
  }
  
  // Return validation result
  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      warnings
    }
  }
  
  // Build config object
  const config: EnvConfig = {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey,
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
    VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  }
  
  return {
    isValid: true,
    errors: [],
    warnings,
    config
  }
}

/**
 * Log environment validation results
 */
export function logEnvironmentValidation(): void {
  const result = validateEnvironment()
  
  console.group('🔍 Environment Validation')
  
  if (result.isValid) {
    console.log('✅ All required environment variables are present')
    
    if (result.warnings.length > 0) {
      console.warn('⚠️ Warnings:')
      result.warnings.forEach(warning => console.warn(`  - ${warning}`))
    }
    
    // Log environment info (without sensitive data)
    console.log('📊 Configuration:')
    console.log(`  - Supabase URL: ${result.config?.VITE_SUPABASE_URL}`)
    console.log(`  - Firebase enabled: ${!!result.config?.VITE_FIREBASE_PROJECT_ID}`)
    console.log(`  - Sentry enabled: ${!!result.config?.VITE_SENTRY_DSN}`)
    console.log(`  - App version: ${result.config?.VITE_APP_VERSION || 'not set'}`)
    console.log(`  - App name: ${result.config?.VITE_APP_NAME || 'not set'}`)
  } else {
    console.error('❌ Environment validation failed')
    console.error('Errors:')
    result.errors.forEach(error => console.error(`  - ${error}`))
    
    if (result.warnings.length > 0) {
      console.warn('Warnings:')
      result.warnings.forEach(warning => console.warn(`  - ${warning}`))
    }
  }
  
  console.groupEnd()
}

/**
 * Assert that environment is valid, throw error if not
 */
export function assertValidEnvironment(): void {
  const result = validateEnvironment()
  
  if (!result.isValid) {
    const errorMessage = 'Environment validation failed:\n' + result.errors.join('\n')
    throw new Error(errorMessage)
  }
  
  // Log warnings in development
  if (import.meta.env.DEV && result.warnings.length > 0) {
    console.warn('Environment warnings:', result.warnings)
  }
}

/**
 * Get validated environment config
 */
export function getEnvConfig(): EnvConfig {
  const result = validateEnvironment()
  
  if (!result.isValid) {
    throw new Error('Invalid environment configuration')
  }
  
  return result.config!
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return import.meta.env.PROD
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV
}

/**
 * Get app version
 */
export function getAppVersion(): string {
  return import.meta.env.VITE_APP_VERSION || '1.0.0'
}

/**
 * Get app name
 */
export function getAppName(): string {
  return import.meta.env.VITE_APP_NAME || 'CampusConnect'
}

