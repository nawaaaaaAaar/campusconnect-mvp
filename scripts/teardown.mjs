#!/usr/bin/env node
// Teardown script for E2E test environment
import { createClient } from '@supabase/supabase-js'

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  E2E_DELETE_DOMAIN = 'example.com'
} = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

async function main() {
  // Delete any test users created by seed script
  const { data: users, error } = await supabase.auth.admin.listUsers()
  if (error) {
    console.error('Failed listing users:', error)
    process.exit(1)
  }

  const testUsers = users.users.filter(u => u.email?.endsWith(`@${E2E_DELETE_DOMAIN}`))
  for (const u of testUsers) {
    const { error: delErr } = await supabase.auth.admin.deleteUser(u.id)
    if (delErr) {
      console.error('Failed deleting user', u.email, delErr)
    } else {
      console.log('Deleted user', u.email)
    }
  }

  // Add any table cleanup here as needed
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})



