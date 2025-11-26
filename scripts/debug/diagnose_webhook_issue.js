import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnose() {
  console.log('=== Diagnosing Calendly Webhook Issue ===\n')

  const testEmail = 'test.calendly@mystoragevalet.com'
  const testUserId = '62a2977f-4c97-4b85-89fe-34925f3277f9'

  console.log('Test email:', testEmail)
  console.log('Test user_id:', testUserId)
  console.log('')

  // Check if we can find the profile by email (what the webhook does)
  console.log('1. Attempting to query customer_profile by email...')
  const { data: profileByEmail, error: emailError } = await supabase
    .from('customer_profile')
    .select('user_id, email, delivery_address')
    .eq('email', testEmail)
    .single()

  if (emailError) {
    console.log('❌ FAIL: Cannot query by email')
    console.log('   Error:', emailError.message)
    console.log('   Code:', emailError.code)
    console.log('   This is likely why the webhook fails!')
    console.log('')
    console.log('🔍 RLS Issue: The anon key cannot read customer_profile.')
    console.log('   The webhook uses service role key, which should bypass RLS.')
    console.log('   But if the profile does not exist or has wrong email, it will fail.')
  } else if (!profileByEmail) {
    console.log('❌ FAIL: No profile found with email:', testEmail)
    console.log('   The webhook cannot proceed without finding this profile.')
  } else {
    console.log('✅ Profile found by email!')
    console.log('   User ID:', profileByEmail.user_id)
    console.log('   Email:', profileByEmail.email)
    console.log('   Has address:', !!profileByEmail.delivery_address)
  }

  // Check if we can query by user_id
  console.log('\n2. Attempting to query customer_profile by user_id...')
  const { data: profileById, error: idError } = await supabase
    .from('customer_profile')
    .select('user_id, email, delivery_address')
    .eq('user_id', testUserId)
    .single()

  if (idError) {
    console.log('❌ FAIL: Cannot query by user_id')
    console.log('   Error:', idError.message)
    console.log('   Code:', idError.code)
  } else if (!profileById) {
    console.log('❌ FAIL: No profile found with user_id:', testUserId)
  } else {
    console.log('✅ Profile found by user_id!')
    console.log('   User ID:', profileById.user_id)
    console.log('   Email:', profileById.email)
    console.log('   Has address:', !!profileById.delivery_address)
  }

  // Check auth users
  console.log('\n3. Checking if auth user exists...')
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.log('❌ Cannot list auth users (expected with anon key)')
  } else {
    const matchingUser = authData.users.find(u => u.email === testEmail || u.id === testUserId)
    if (matchingUser) {
      console.log('✅ Auth user exists!')
      console.log('   ID:', matchingUser.id)
      console.log('   Email:', matchingUser.email)
    } else {
      console.log('⚠️  No matching auth user found')
    }
  }

  console.log('\n=== DIAGNOSIS SUMMARY ===\n')
  console.log('If profile lookups fail above, the webhook will fail at:')
  console.log('  calendly-webhook/index.ts:105-109')
  console.log('  Where it tries: .from("customer_profile").select(...).eq("email", inviteeEmail)')
  console.log('')
  console.log('Possible fixes:')
  console.log('  1. Ensure customer_profile has RLS policy allowing service role to read')
  console.log('  2. Verify the profile actually exists with exact email match')
  console.log('  3. Check Supabase function logs for exact error message')
}

diagnose().catch(console.error)
