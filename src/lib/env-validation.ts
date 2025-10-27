import { z } from 'zod'

// Environment variables schema with validation
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY is required'),
  VITE_FIREBASE_API_KEY: z.string().optional(),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  VITE_FIREBASE_PROJECT_ID: z.string().optional(),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  VITE_FIREBASE_APP_ID: z.string().optional(),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_APP_VERSION: z.string().optional(),
  VITE_APP_NAME: z.string().optional(),
})

// Validation result interface
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  config?: z.infer<typeof envSchema>
}

// Validate environment variables
export function validateEnvironment(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Get environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY
    const firebaseProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
    const firebaseAppId = import.meta.env.VITE_FIREBASE_APP_ID

    // Required fields validation
    if (!supabaseUrl) {
      errors.push('VITE_SUPABASE_URL is required')
    } else if (!supabaseUrl.includes('supabase.co')) {
      warnings.push('VITE_SUPABASE_URL does not appear to be a valid Supabase URL')
    }

    if (!supabaseAnonKey) {
      errors.push('VITE_SUPABASE_ANON_KEY is required')
    } else if (supabaseAnonKey.length < 20) {
      warnings.push('VITE_SUPABASE_ANON_KEY appears to be invalid (too short)')
    }

    // Optional Firebase validation
    if (firebaseApiKey || firebaseProjectId || firebaseAppId) {
      const firebaseFields = [firebaseApiKey, firebaseProjectId, firebaseAppId]
      const hasAllFirebaseFields = firebaseFields.every(field => field && field.length > 0)
      
      if (!hasAllFirebaseFields) {
        warnings.push('Firebase configuration is incomplete. Push notifications will not work. Required: VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID')
      }
    }

    const sentryDsn = import.meta.env.VITE_SENTRY_DSN
    if (sentryDsn && !sentryDsn.includes('sentry.io') && !sentryDsn.includes('sentry.dev')) {
      warnings.push('VITE_SENTRY_DSN is set but appears to be invalid')
    }

    if (!import.meta.env.VITE_APP_VERSION) {
      warnings.push('VITE_APP_VERSION is not set')
    }

    if (!import.meta.env.VITE_APP_NAME) {
      warnings.push('VITE_APP_NAME is not set')
    }

    // Parse and validate using schema
    const envData = envSchema.parse({
      VITE_SUPABASE_URL: supabaseUrl,
      VITE_SUPABASE_ANON_KEY: supabaseAnonKey,
      VITE_FIREBASE_API_KEY: firebaseApiKey,
      VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      VITE_FIREBASE_PROJECT_ID: firebaseProjectId,
      VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      VITE_FIREBASE_APP_ID: firebaseAppId,
      VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      VITE_SENTRY_DSN: sentryDsn,
      VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
      VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      config: envData
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map(err => `${err.path.join('.')}: ${err.message}`))
    } else {
      errors.push('Failed to validate environment variables')
    }

    return {
      isValid: false,
      errors,
      warnings
    }
  }
}

// Log validation results (development only)
export function logEnvironmentStatus(result: ValidationResult) {
  if (import.meta.env.DEV) {
    console.group('🔍 Environment Validation')
    
    if (result.isValid) {
      console.log('✅ All required environment variables are present')
    } else {
      console.log('❌ Environment validation failed')
      result.errors.forEach(error => console.error('Error:', error))
    }
    
    console.log('📊 Configuration:')
    if (result.config) {
      console.log(`  - Supabase URL: ${result.config.VITE_SUPABASE_URL}`)
      console.log(`  - Firebase enabled: ${!!result.config.VITE_FIREBASE_PROJECT_ID}`)
      console.log(`  - Sentry enabled: ${!!result.config.VITE_SENTRY_DSN}`)
      console.log(`  - App version: ${result.config.VITE_APP_VERSION || 'not set'}`)
      console.log(`  - App name: ${result.config.VITE_APP_NAME || 'not set'}`)
    }
    
    result.warnings.forEach(warning => console.warn('Warning:', warning))
    
    console.groupEnd()
  }
}

// Get current app version
export function getAppVersion(): string {
  return import.meta.env.VITE_APP_VERSION || '1.0.0'
}

// Get current app name
export function getAppName(): string {
  return import.meta.env.VITE_APP_NAME || 'CampusConnect'
}

