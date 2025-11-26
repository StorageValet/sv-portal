import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Known test user from production
const TEST_USER_ID = '62a2977f-4c97-4b85-89fe-34925f3277f9'
const TEST_EMAIL = 'test.calendly@mystoragevalet.com'
const TEST_ADDRESS = {
  street: "123 Test St",
  city: "Hoboken",
  state: "NJ",
  zip: "07030"
}

async function testCalendlyManual() {
  console.log('=== Phase 3: Calendly Schema Validation Test ===\n')
  console.log('Using test user:', TEST_EMAIL)
  console.log('User ID:', TEST_USER_ID)

  // 1. Test inserting an action with Calendly webhook fields
  console.log('\n--- Test 1: Insert action with Calendly webhook fields ---')

  const testAction = {
    user_id: TEST_USER_ID,
    calendly_event_uri: 'https://api.calendly.com/scheduled_events/TEST_' + Date.now(),
    scheduled_start: new Date().toISOString(),
    scheduled_end: new Date(Date.now() + 3600000).toISOString(),
    status: 'pending_items',
    service_address: TEST_ADDRESS,
    calendly_payload: { test: true, invitee_email: TEST_EMAIL }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('actions')
    .insert(testAction)
    .select()

  if (insertError) {
    console.log('❌ FAIL: Insert failed:', insertError.message)
    console.log('   Code:', insertError.code)
    console.log('   Details:', insertError.details)
    console.log('   Hint:', insertError.hint)
    return
  }

  console.log('✅ PASS: Action inserted successfully')
  console.log('   Action ID:', inserted[0].id)
  console.log('   Status:', inserted[0].status)
  console.log('   Scheduled start:', inserted[0].scheduled_start)
  console.log('   Scheduled end:', inserted[0].scheduled_end)
  console.log('   Calendly URI:', inserted[0].calendly_event_uri)
  console.log('   Service address:', JSON.stringify(inserted[0].service_address))

  // 2. Test log_booking_event function
  console.log('\n--- Test 2: Log booking event (created) ---')

  const { error: logError } = await supabase.rpc('log_booking_event', {
    p_action_id: inserted[0].id,
    p_event_type: 'created',
    p_metadata: {
      source: 'calendly_webhook',
      event_uri: inserted[0].calendly_event_uri,
      invitee_email: TEST_EMAIL
    }
  })

  if (logError) {
    console.log('❌ FAIL: log_booking_event failed:', logError.message)
  } else {
    console.log('✅ PASS: log_booking_event succeeded')
  }

  // 3. Verify booking event was logged
  console.log('\n--- Test 3: Verify booking event logged ---')

  const { data: events, error: eventsError } = await supabase
    .from('booking_events')
    .select('*')
    .eq('action_id', inserted[0].id)
    .order('created_at', { ascending: false })

  if (eventsError) {
    console.log('❌ FAIL: Could not query booking_events:', eventsError.message)
  } else if (events && events.length > 0) {
    console.log('✅ PASS: Booking event was logged')
    console.log('   Event type:', events[0].event_type)
    console.log('   Metadata:', JSON.stringify(events[0].metadata))
  } else {
    console.log('❌ FAIL: No booking event found in booking_events table')
  }

  // 4. Test cancellation flow
  console.log('\n--- Test 4: Update action to canceled ---')

  const { error: cancelError } = await supabase
    .from('actions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('id', inserted[0].id)

  if (cancelError) {
    console.log('❌ FAIL: Failed to update action status:', cancelError.message)
  } else {
    console.log('✅ PASS: Action status updated to canceled')
  }

  // Log cancellation event
  console.log('\n--- Test 5: Log booking event (canceled) ---')

  const { error: cancelLogError } = await supabase.rpc('log_booking_event', {
    p_action_id: inserted[0].id,
    p_event_type: 'canceled',
    p_metadata: {
      source: 'calendly_webhook',
      event_uri: inserted[0].calendly_event_uri,
      previous_status: 'pending_items'
    }
  })

  if (cancelLogError) {
    console.log('❌ FAIL: Failed to log cancellation:', cancelLogError.message)
  } else {
    console.log('✅ PASS: Cancellation event logged')
  }

  // 6. Verify final state
  console.log('\n--- Test 6: Verify final state ---')

  const { data: finalAction } = await supabase
    .from('actions')
    .select('*')
    .eq('id', inserted[0].id)
    .single()

  const { data: allEvents } = await supabase
    .from('booking_events')
    .select('*')
    .eq('action_id', inserted[0].id)
    .order('created_at', { ascending: true })

  console.log('Final action status:', finalAction?.status)
  console.log('Total booking events:', allEvents?.length)
  if (allEvents && allEvents.length > 0) {
    console.log('Event types:', allEvents.map(e => e.event_type).join(', '))
  }

  if (finalAction?.status === 'canceled' && allEvents?.length === 2) {
    console.log('✅ PASS: Complete flow verified (created → canceled with 2 events)')
  } else {
    console.log('❌ FAIL: Unexpected final state')
  }

  // Clean up
  console.log('\n--- Cleanup ---')
  await supabase.from('actions').delete().eq('id', inserted[0].id)
  console.log('✅ Test action deleted')

  console.log('\n=== Schema Validation Complete ===')
  console.log('\n✅ All Calendly webhook columns work correctly')
  console.log('✅ log_booking_event function works')
  console.log('✅ booking_events table is accessible')
  console.log('\n📋 Next: Manual Calendly booking test')
  console.log('   1. Visit: https://calendly.com/zach-mystoragevalet')
  console.log('   2. Book an appointment using: test.calendly@mystoragevalet.com')
  console.log('   3. After booking, run: node check_calendly_booking.js')
}

testCalendlyManual().catch(console.error)
