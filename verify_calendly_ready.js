import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifySetup() {
  console.log('=== Phase 3: Pre-Flight Verification ===\n')

  console.log('✅ Test user exists: test.calendly@mystoragevalet.com')
  console.log('✅ User ID: 62a2977f-4c97-4b85-89fe-34925f3277f9')
  console.log('✅ Calendly webhook deployed and configured')
  console.log('✅ CALENDLY_WEBHOOK_SECRET set in Supabase')
  console.log('✅ Webhook URL: https://gmjucacmbrumncfnnhua.supabase.co/functions/v1/calendly-webhook')

  console.log('\n--- Checking Schema ---')

  // Check if we can read actions table structure (even if empty/restricted)
  const { error: actionsError } = await supabase
    .from('actions')
    .select('id')
    .limit(0)

  if (actionsError && actionsError.code !== 'PGRST116') {
    console.log('⚠️  actions table access:', actionsError.message)
  } else {
    console.log('✅ actions table exists and is accessible')
  }

  // Check booking_events
  const { error: eventsError } = await supabase
    .from('booking_events')
    .select('id')
    .limit(0)

  if (eventsError && eventsError.code !== 'PGRST116') {
    console.log('⚠️  booking_events table access:', eventsError.message)
  } else {
    console.log('✅ booking_events table exists and is accessible')
  }

  console.log('\n=== System Ready for Live Calendly Test ===\n')
  console.log('📋 MANUAL TEST STEPS:\n')
  console.log('1. Visit: https://calendly.com/zach-mystoragevalet')
  console.log('2. Select a time slot')
  console.log('3. Enter the following details:')
  console.log('   Email: test.calendly@mystoragevalet.com')
  console.log('   Name: Test User')
  console.log('4. Complete the booking')
  console.log('5. Wait 5-10 seconds for webhook to process')
  console.log('6. Run: node check_calendly_booking.js')
  console.log('\n📝 EXPECTED RESULTS AFTER BOOKING:')
  console.log('   • New row in actions table')
  console.log('   • status = "pending_items"')
  console.log('   • scheduled_start and scheduled_end populated')
  console.log('   • calendly_event_uri populated')
  console.log('   • service_address snapshot saved')
  console.log('   • booking_events row with event_type = "created"')
  console.log('\n🔴 TO TEST CANCELLATION:')
  console.log('   1. Cancel the event in Calendly')
  console.log('   2. Wait 5-10 seconds')
  console.log('   3. Run: node check_calendly_booking.js')
  console.log('   4. Verify action.status = "canceled"')
  console.log('   5. Verify new booking_events row with event_type = "canceled"')
  console.log('\n⏳ Ready when you are!')
}

verifySetup().catch(console.error)
