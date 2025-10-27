/**
 * Security utilities for CampusConnect
 * Provides input validation, sanitization, and security helpers
 */

// XSS Protection - Basic HTML sanitization
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return ['http:', 'https:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Academic email validation - only allow university emails
export function isValidAcademicEmail(email: string): boolean {
  if (!isValidEmail(email)) {
    return false
  }

  // List of blocked personal email domains
  const blockedDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
    'aol.com', 'icloud.com', 'live.com', 'msn.com',
    'yandex.com', 'mail.com', 'protonmail.com', 'gmx.com'
  ]

  const domain = email.split('@')[1].toLowerCase()

  // Check if email is from a blocked personal domain
  if (blockedDomains.includes(domain)) {
    return false
  }

  // Allow academic emails by checking for common academic indicators
  const academicIndicators = [
    // Common academic domains
    '.edu', '.ac.', 'edu.', 'ac.',
    // IIT domains
    'iit', 'iitm', 'iitb', 'iitd', 'iitk', 'iitg', 'iitr', 'iith', 'iiti', 'iitj', 'iitp',
    // NIT domains  
    'nit', 'nitd', 'nitk', 'nitw', 'nitc', 'nits', 'nitj', 'nitr', 'nitp',
    // University domains
    'university', 'college', 'edu', 'ac.in', 'edu.in', 'ac.uk', 'edu.au', 'edu.ca'
  ]

  // Check if domain contains academic indicators
  return academicIndicators.some(indicator => 
    domain.includes(indicator.toLowerCase())
  )
}

// Get academic email validation error message
export function getAcademicEmailErrorMessage(email: string): string {
  if (!isValidEmail(email)) {
    return 'Please enter a valid email address'
  }

  if (!isValidAcademicEmail(email)) {
    return 'Please use your university/college email address. Personal email providers like Gmail, Yahoo, etc. are not allowed.'
  }

  return ''
}

// Password strength validation
export function validatePassword(password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long')
  } else {
    score += 1
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter')
  } else {
    score += 1
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter')
  } else {
    score += 1
  }

  if (!/\d/.test(password)) {
    feedback.push('Password must contain at least one number')
  } else {
    score += 1
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('Password must contain at least one special character')
  } else {
    score += 1
  }

  return {
    isValid: score >= 4,
    score,
    feedback
  }
}

// Input length validation
export function validateInputLength(
  input: string, 
  minLength: number = 1, 
  maxLength: number = 1000
): { isValid: boolean; message?: string } {
  if (input.length < minLength) {
    return { isValid: false, message: `Input must be at least ${minLength} characters long` }
  }
  if (input.length > maxLength) {
    return { isValid: false, message: `Input cannot exceed ${maxLength} characters` }
  }
  return { isValid: true }
}

// SQL injection prevention (basic)
export function sanitizeForDatabase(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[;\\]/g, '') // Remove semicolons and backslashes
    .trim()
}

// Rate limiting helper
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const requests = this.requests.get(identifier) || []
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs)
    
    if (validRequests.length >= this.maxRequests) {
      return false
    }
    
    validRequests.push(now)
    this.requests.set(identifier, validRequests)
    return true
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now()
    const requests = this.requests.get(identifier) || []
    const validRequests = requests.filter(time => now - time < this.windowMs)
    return Math.max(0, this.maxRequests - validRequests.length)
  }
}

// Content Security Policy helper
export function generateCSP(nonce?: string): string {
  const baseCSP = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in https://firebase.googleapis.com https://fcm.googleapis.com",
    "frame-src 'self' https://*.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ]

  if (nonce) {
    baseCSP[1] += ` 'nonce-${nonce}'`
  }

  return baseCSP.join('; ')
}

// File upload validation
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number
    allowedTypes?: string[]
    allowedExtensions?: string[]
  } = {}
): { isValid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
  } = options

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
    }
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
    }
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`
    }
  }

  return { isValid: true }
}

// CSRF token generation (basic)
export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Input sanitization for user-generated content
export function sanitizeUserContent(content: string): string {
  if (typeof content !== 'string') return ''
  
  return content
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 2000) // Limit length
}

// Phone number validation
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''))
}

// Username validation
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

// Institute name validation
export function isValidInstituteName(name: string): boolean {
  if (name.length < 2 || name.length > 100) return false
  const validChars = /^[a-zA-Z0-9\s\-.&()]+$/
  return validChars.test(name)
}
