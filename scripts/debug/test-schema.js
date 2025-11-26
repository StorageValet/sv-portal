import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ FAIL: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('=== Phase 1: Database Migration Verification ===\n')

  // Check customer_profile columns
  console.log('1. Checking customer_profile new columns...')
  const { data: profile, error: profileError } = await supabase
    .from('customer_profile')
    .select('out_of_service_area, needs_manual_refund')
    .limit(1)

  if (profileError) {
    console.log('❌ FAIL: customer_profile columns missing')
    console.log('Error:', profileError.message)
  } else {
    console.log('✅ PASS: customer_profile has out_of_service_area, needs_manual_refund')
  }

  // Check actions columns
  console.log('\n2. Checking actions new columns...')
  const { data: action, error: actionError } = await supabase
    .from('actions')
    .select('calendly_event_uri, pickup_item_ids, delivery_item_ids, service_address, scheduled_end')
    .limit(1)

  if (actionError) {
    console.log('❌ FAIL: actions columns missing')
    console.log('Error:', actionError.message)
  } else {
    console.log('✅ PASS: actions has calendly_event_uri, pickup_item_ids, delivery_item_ids, service_address, scheduled_end')
  }

  // Check booking_events table
  console.log('\n3. Checking booking_events table...')
  const { data: events, error: eventsError } = await supabase
    .from('booking_events')
    .select('*')
    .limit(1)

  if (eventsError) {
    console.log('❌ FAIL: booking_events table missing')
    console.log('Error:', eventsError.message)
  } else {
    console.log('✅ PASS: booking_events table exists')
  }

  // Check log_booking_event function exists
  console.log('\n4. Checking log_booking_event() function...')
  const { data: funcTest, error: funcError } = await supabase
    .rpc('log_booking_event', {
      p_action_id: '00000000-0000-0000-0000-000000000000',
      p_event_type: 'test',
      p_metadata: {}
    })

  if (funcError && funcError.message.includes('does not exist')) {
    console.log('❌ FAIL: log_booking_event() function missing')
    console.log('Error:', funcError.message)
  } else if (funcError && (funcError.message.includes('violates foreign key') || funcError.message.includes('permission denied'))) {
    console.log('✅ PASS: log_booking_event() function exists (FK/permission error expected for test UUID)')
  } else if (!funcError) {
    console.log('✅ PASS: log_booking_event() function exists')
  } else {
    console.log('⚠️  WARN: Unexpected error from log_booking_event()')
    console.log('Error:', funcError.message)
  }

  console.log('\n=== Phase 1 Complete ===')
}

checkSchema().catch(console.error)
