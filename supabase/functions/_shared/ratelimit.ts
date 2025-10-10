/**
 * Rate Limiting for Supabase Edge Functions
 * Implements token bucket algorithm with Redis-like storage
 */

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyPrefix?: string
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

/**
 * Simple in-memory rate limiter
 * In production, use Redis or Supabase for distributed rate limiting
 */
class InMemoryRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map()

  check(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now()
    const prefixedKey = `${config.keyPrefix || 'rl'}:${key}`
    
    const record = this.requests.get(prefixedKey)
    
    // Clean up expired entries
    if (record && now >= record.resetTime) {
      this.requests.delete(prefixedKey)
    }
    
    const currentRecord = this.requests.get(prefixedKey)
    
    if (!currentRecord) {
      // First request in window
      const resetTime = now + config.windowMs
      this.requests.set(prefixedKey, { count: 1, resetTime })
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime
      }
    }
    
    // Check if limit exceeded
    if (currentRecord.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: currentRecord.resetTime
      }
    }
    
    // Increment count
    currentRecord.count++
    this.requests.set(prefixedKey, currentRecord)
    
    return {
      allowed: true,
      remaining: config.maxRequests - currentRecord.count,
      resetTime: currentRecord.resetTime
    }
  }
  
  // Cleanup old entries periodically
  cleanup() {
    const now = Date.now()
    for (const [key, record] of this.requests.entries()) {
      if (now >= record.resetTime) {
        this.requests.delete(key)
      }
    }
  }
}

// Global rate limiter instance
const rateLimiter = new InMemoryRateLimiter()

// Cleanup every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000)

/**
 * Rate limit configurations for different endpoints
 */
export const rateLimitConfigs = {
  // Authentication endpoints - stricter limits
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyPrefix: 'auth'
  },
  
  // API endpoints - moderate limits
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'api'
  },
  
  // Read operations - higher limits
  read: {
    maxRequests: 200,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'read'
  },
  
  // Write operations - lower limits
  write: {
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'write'
  },
  
  // Admin operations - very strict
  admin: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'admin'
  }
}

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = rateLimitConfigs.api
): RateLimitResult {
  return rateLimiter.check(identifier, config)
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)
  
  return new Response(
    JSON.stringify({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter
      }
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(result.remaining + 1),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.floor(result.resetTime / 1000)),
        'Retry-After': String(retryAfter)
      }
    }
  )
}

/**
 * Get rate limit identifier from request
 * Uses IP address and user ID if available
 */
export function getRateLimitIdentifier(req: Request, userId?: string): string {
  // Try to get IP from headers (Cloudflare, Vercel, etc.)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
              req.headers.get('x-real-ip') ||
              'unknown'
  
  // Combine IP with user ID for authenticated requests
  return userId ? `${userId}:${ip}` : ip
}

