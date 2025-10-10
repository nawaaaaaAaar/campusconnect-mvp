/**
 * Input Validation and Sanitization Utilities
 * Protects against XSS, SQL injection, and other attacks
 */

/**
 * Sanitize HTML to prevent XSS
 */
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

/**
 * Validate and sanitize email
 */
export function validateEmail(email: string): { valid: boolean; email?: string; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' }
  }
  
  const trimmed = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' }
  }
  
  if (trimmed.length > 254) {
    return { valid: false, error: 'Email is too long' }
  }
  
  return { valid: true, email: trimmed }
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Validate and sanitize text content
 */
export function validateText(
  text: string,
  options: {
    minLength?: number
    maxLength?: number
    allowEmpty?: boolean
    fieldName?: string
  } = {}
): { valid: boolean; text?: string; error?: string } {
  const {
    minLength = 1,
    maxLength = 5000,
    allowEmpty = false,
    fieldName = 'Text'
  } = options
  
  if (!text && !allowEmpty) {
    return { valid: false, error: `${fieldName} is required` }
  }
  
  if (!text && allowEmpty) {
    return { valid: true, text: '' }
  }
  
  const trimmed = text.trim()
  
  if (trimmed.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters` }
  }
  
  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} must not exceed ${maxLength} characters` }
  }
  
  // Remove potential XSS patterns
  const sanitized = sanitizeHtml(trimmed)
  
  return { valid: true, text: sanitized }
}

/**
 * Validate URL
 */
export function validateUrl(url: string): { valid: boolean; url?: string; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' }
  }
  
  try {
    const urlObj = new URL(url)
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' }
    }
    
    return { valid: true, url: url.trim() }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
}

/**
 * Validate society category
 */
const VALID_CATEGORIES = [
  'sports', 'cultural', 'technical', 'academic', 'social',
  'arts', 'music', 'dance', 'drama', 'photography',
  'entrepreneurship', 'volunteer', 'other'
]

export function validateCategory(category: string): { valid: boolean; category?: string; error?: string } {
  if (!category) {
    return { valid: false, error: 'Category is required' }
  }
  
  const normalized = category.toLowerCase().trim()
  
  if (!VALID_CATEGORIES.includes(normalized)) {
    return { valid: false, error: 'Invalid category' }
  }
  
  return { valid: true, category: normalized }
}

/**
 * Validate post type
 */
const VALID_POST_TYPES = ['text', 'image', 'link', 'event']

export function validatePostType(type: string): { valid: boolean; type?: string; error?: string } {
  if (!type) {
    return { valid: false, error: 'Post type is required' }
  }
  
  const normalized = type.toLowerCase().trim()
  
  if (!VALID_POST_TYPES.includes(normalized)) {
    return { valid: false, error: 'Invalid post type' }
  }
  
  return { valid: true, type: normalized }
}

/**
 * Validate account type
 */
export function validateAccountType(accountType: string): { valid: boolean; accountType?: 'student' | 'society'; error?: string } {
  if (!accountType) {
    return { valid: false, error: 'Account type is required' }
  }
  
  const normalized = accountType.toLowerCase().trim()
  
  if (normalized !== 'student' && normalized !== 'society') {
    return { valid: false, error: 'Account type must be student or society' }
  }
  
  return { valid: true, accountType: normalized as 'student' | 'society' }
}

/**
 * Validate pagination parameters
 */
export function validatePagination(params: {
  limit?: string | number
  cursor?: string
}): { valid: boolean; limit?: number; cursor?: string; error?: string } {
  const result: any = { valid: true }
  
  // Validate limit
  if (params.limit !== undefined) {
    const limit = typeof params.limit === 'string' ? parseInt(params.limit, 10) : params.limit
    
    if (isNaN(limit) || limit < 1) {
      return { valid: false, error: 'Limit must be a positive number' }
    }
    
    if (limit > 100) {
      return { valid: false, error: 'Limit cannot exceed 100' }
    }
    
    result.limit = limit
  } else {
    result.limit = 20 // Default limit
  }
  
  // Validate cursor (should be ISO timestamp)
  if (params.cursor) {
    const cursorDate = new Date(params.cursor)
    if (isNaN(cursorDate.getTime())) {
      return { valid: false, error: 'Invalid cursor format' }
    }
    result.cursor = params.cursor
  }
  
  return result
}

/**
 * Validate request body against schema
 */
export function validateRequestBody<T>(
  body: any,
  requiredFields: string[],
  optionalFields: string[] = []
): { valid: boolean; data?: T; errors?: string[] } {
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object'] }
  }
  
  const errors: string[] = []
  
  // Check required fields
  for (const field of requiredFields) {
    if (!(field in body) || body[field] === null || body[field] === undefined) {
      errors.push(`Missing required field: ${field}`)
    }
  }
  
  // Check for unknown fields
  const allowedFields = [...requiredFields, ...optionalFields]
  for (const field of Object.keys(body)) {
    if (!allowedFields.includes(field)) {
      errors.push(`Unknown field: ${field}`)
    }
  }
  
  if (errors.length > 0) {
    return { valid: false, errors }
  }
  
  return { valid: true, data: body as T }
}

/**
 * Sanitize and validate file upload
 */
export function validateMediaFile(data: {
  mediaData?: string
  fileName?: string
  mediaType?: string
}): { valid: boolean; error?: string } {
  if (!data.mediaData || !data.fileName || !data.mediaType) {
    return { valid: false, error: 'mediaData, fileName, and mediaType are required' }
  }
  
  // Validate file name
  const fileNameRegex = /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/
  if (!fileNameRegex.test(data.fileName)) {
    return { valid: false, error: 'Invalid file name format' }
  }
  
  // Validate media type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(data.mediaType)) {
    return { valid: false, error: 'Invalid media type. Allowed: JPEG, PNG, WebP, GIF' }
  }
  
  // Validate base64 data
  const base64Regex = /^data:image\/(jpeg|png|webp|gif);base64,/
  if (!base64Regex.test(data.mediaData)) {
    return { valid: false, error: 'Invalid base64 image data' }
  }
  
  // Check file size (limit to 10MB in base64)
  const base64Length = data.mediaData.split(',')[1]?.length || 0
  const fileSizeBytes = (base64Length * 3) / 4
  const maxSizeBytes = 10 * 1024 * 1024 // 10MB
  
  if (fileSizeBytes > maxSizeBytes) {
    return { valid: false, error: 'File size exceeds 10MB limit' }
  }
  
  return { valid: true }
}

