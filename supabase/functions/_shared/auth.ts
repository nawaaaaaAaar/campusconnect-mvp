/**
 * Authentication and Authorization Utilities
 * Handles JWT verification and user role checks
 */

import { ErrorCode, createErrorResponse } from './errors.ts'

export interface AuthUser {
  id: string
  email: string
  role?: string
  app_metadata?: Record<string, any>
  user_metadata?: Record<string, any>
}

export interface AuthResult {
  success: boolean
  user?: AuthUser
  error?: string
}

/**
 * Verify JWT and get user from Supabase Auth
 */
export async function verifyAuth(
  req: Request,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization')
  
  if (!authHeader) {
    return { success: false, error: 'Missing authorization header' }
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return { success: false, error: 'Invalid authorization header format' }
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  try {
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': serviceRoleKey
      }
    })
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error('Auth verification failed:', errorText)
      return { success: false, error: 'Invalid or expired token' }
    }
    
    const userData = await userResponse.json()
    
    return {
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        app_metadata: userData.app_metadata || {},
        user_metadata: userData.user_metadata || {}
      }
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * Require authentication - throw error if not authenticated
 */
export async function requireAuth(
  req: Request,
  supabaseUrl: string,
  serviceRoleKey: string,
  corsHeaders: Record<string, string>
): Promise<AuthUser> {
  const authResult = await verifyAuth(req, supabaseUrl, serviceRoleKey)
  
  if (!authResult.success || !authResult.user) {
    throw createErrorResponse(
      ErrorCode.UNAUTHORIZED,
      authResult.error || 'Authentication required',
      corsHeaders
    )
  }
  
  return authResult.user
}

/**
 * Check if user has specific role
 */
export function hasRole(user: AuthUser, role: string): boolean {
  return user.role === role || user.app_metadata?.role === role
}

/**
 * Check if user is admin
 */
export async function isAdmin(
  userId: string,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<boolean> {
  try {
    // Check admin_users table
    const response = await fetch(
      `${supabaseUrl}/rest/v1/admin_users?user_id=eq.${userId}&select=is_active`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    )
    
    if (!response.ok) {
      return false
    }
    
    const admins = await response.json()
    return admins.length > 0 && admins[0].is_active === true
  } catch (error) {
    console.error('Admin check failed:', error)
    return false
  }
}

/**
 * Require admin role
 */
export async function requireAdmin(
  user: AuthUser,
  supabaseUrl: string,
  serviceRoleKey: string,
  corsHeaders: Record<string, string>
): Promise<void> {
  const adminStatus = await isAdmin(user.id, supabaseUrl, serviceRoleKey)
  
  if (!adminStatus) {
    throw createErrorResponse(
      ErrorCode.FORBIDDEN,
      'Admin access required',
      corsHeaders
    )
  }
}

/**
 * Check if user is member of society
 */
export async function isSocietyMember(
  userId: string,
  societyId: string,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<{ isMember: boolean; role?: string }> {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/society_members?user_id=eq.${userId}&society_id=eq.${societyId}&select=role`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    )
    
    if (!response.ok) {
      return { isMember: false }
    }
    
    const members = await response.json()
    
    if (members.length === 0) {
      return { isMember: false }
    }
    
    return {
      isMember: true,
      role: members[0].role
    }
  } catch (error) {
    console.error('Society membership check failed:', error)
    return { isMember: false }
  }
}

/**
 * Require society membership
 */
export async function requireSocietyMembership(
  userId: string,
  societyId: string,
  supabaseUrl: string,
  serviceRoleKey: string,
  corsHeaders: Record<string, string>,
  requiredRole?: string
): Promise<string> {
  const { isMember, role } = await isSocietyMember(
    userId,
    societyId,
    supabaseUrl,
    serviceRoleKey
  )
  
  if (!isMember) {
    throw createErrorResponse(
      ErrorCode.FORBIDDEN,
      'You must be a member of this society',
      corsHeaders
    )
  }
  
  if (requiredRole && role !== requiredRole && role !== 'admin' && role !== 'owner') {
    throw createErrorResponse(
      ErrorCode.FORBIDDEN,
      `${requiredRole} role required`,
      corsHeaders
    )
  }
  
  return role || 'member'
}

/**
 * Check if user owns a resource
 */
export async function isResourceOwner(
  userId: string,
  resourceType: 'post' | 'comment' | 'society',
  resourceId: string,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<boolean> {
  try {
    const table = resourceType === 'post' ? 'posts' :
                  resourceType === 'comment' ? 'post_comments' :
                  'societies'
    
    const ownerField = resourceType === 'society' ? 'owner_user_id' : 'author_id'
    
    const response = await fetch(
      `${supabaseUrl}/rest/v1/${table}?id=eq.${resourceId}&select=${ownerField}`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    )
    
    if (!response.ok) {
      return false
    }
    
    const resources = await response.json()
    
    return resources.length > 0 && resources[0][ownerField] === userId
  } catch (error) {
    console.error('Resource ownership check failed:', error)
    return false
  }
}

/**
 * Get user account type
 */
export async function getUserAccountType(
  userId: string,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<'student' | 'society' | null> {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=account_type`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    )
    
    if (!response.ok) {
      return null
    }
    
    const profiles = await response.json()
    
    return profiles[0]?.account_type || null
  } catch (error) {
    console.error('Account type check failed:', error)
    return null
  }
}

/**
 * Require specific account type
 */
export async function requireAccountType(
  userId: string,
  requiredType: 'student' | 'society',
  supabaseUrl: string,
  serviceRoleKey: string,
  corsHeaders: Record<string, string>
): Promise<void> {
  const accountType = await getUserAccountType(userId, supabaseUrl, serviceRoleKey)
  
  if (accountType !== requiredType) {
    throw createErrorResponse(
      ErrorCode.FORBIDDEN,
      `${requiredType} account required`,
      corsHeaders
    )
  }
}

