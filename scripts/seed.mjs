#!/usr/bin/env node
// Seed script for E2E test environment
import { createClient } from '@supabase/supabase-js'

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

async function main() {
  const timestamp = Date.now()
  const testEmail = `e2e_student_${timestamp}@example.com`
  const testPassword = 'Password123!'

  // Create a confirmed test user (student)
  const { data: userRes, error: userErr } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true
  })
  if (userErr) {
    console.error('Failed to create test user:', userErr)
  } else {
    console.log('Created test user:', userRes.user?.email)
  }

  // Optionally insert baseline domain data here if needed for tests
  // e.g., societies, posts, etc.

  // Output for CI to consume
  console.log(JSON.stringify({ testEmail, testPassword }))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


