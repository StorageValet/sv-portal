import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCalendlyBooking() {
  console.log('=== Checking Calendly Booking Data ===\n')
  console.log('Looking for bookings by: test.calendly@mystoragevalet.com')
  console.log('User ID: 62a2977f-4c97-4b85-89fe-34925f3277f9\n')

  // Check for actions with calendly_event_uri
  console.log('1. Actions with Calendly events:')
  const { data: actions, error: actionsError } = await supabase
    .from('actions')
    .select('id, user_id, status, calendly_event_uri, scheduled_start, scheduled_end, service_address, created_at')
    .eq('user_id', '62a2977f-4c97-4b85-89fe-34925f3277f9')
    .not('calendly_event_uri', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5)

  if (actionsError) {
    console.log('❌ FAIL: Error querying actions:', actionsError.message)
  } else if (actions && actions.length > 0) {
    console.log(`✅ Found ${actions.length} action(s) with Calendly events:\n`)

    actions.forEach((a, idx) => {
      console.log(`--- Action ${idx + 1} ---`)
      console.log(`   ID: ${a.id}`)
      console.log(`   Status: ${a.status}`)

      // Validation checks
      if (a.status === 'pending_items') {
        console.log('   ✅ PASS: status = "pending_items"')
      } else if (a.status === 'canceled') {
        console.log('   ✅ PASS: status = "canceled"')
      } else {
        console.log(`   ⚠️  Unexpected status: ${a.status}`)
      }

      if (a.calendly_event_uri) {
        console.log('   ✅ PASS: calendly_event_uri populated')
        console.log(`      URI: ${a.calendly_event_uri}`)
      } else {
        console.log('   ❌ FAIL: calendly_event_uri is null')
      }

      if (a.scheduled_start && a.scheduled_end) {
        console.log('   ✅ PASS: scheduled_start and scheduled_end populated')
        console.log(`      Start: ${a.scheduled_start}`)
        console.log(`      End: ${a.scheduled_end}`)
      } else {
        console.log('   ❌ FAIL: scheduled_start or scheduled_end is null')
      }

      if (a.service_address && Object.keys(a.service_address).length > 0) {
        console.log('   ✅ PASS: service_address snapshot saved')
        console.log(`      Address: ${JSON.stringify(a.service_address)}`)
      } else {
        console.log('   ❌ FAIL: service_address is null or empty')
      }

      console.log(`   Created: ${a.created_at}`)
      console.log('')
    })
  } else {
    console.log('❌ FAIL: No actions with Calendly events found')
    console.log('   Expected: New action row after Calendly booking')
  }

  // Check booking_events
  console.log('\n2. Recent booking events:')
  const { data: events, error: eventsError } = await supabase
    .from('booking_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (eventsError) {
    console.log('❌ FAIL: Error querying booking_events:', eventsError.message)
  } else if (events && events.length > 0) {
    console.log(`✅ Found ${events.length} booking event(s):\n`)

    const createdEvents = events.filter(e => e.event_type === 'created')
    const canceledEvents = events.filter(e => e.event_type === 'canceled')

    events.forEach((e, idx) => {
      console.log(`--- Event ${idx + 1} ---`)
      console.log(`   Action ID: ${e.action_id || 'NULL'}`)
      console.log(`   Event type: ${e.event_type}`)

      if (e.event_type === 'created') {
        console.log('   ✅ PASS: "created" event logged')
      } else if (e.event_type === 'canceled') {
        console.log('   ✅ PASS: "canceled" event logged')
      }

      console.log(`   Metadata: ${JSON.stringify(e.metadata)}`)
      console.log(`   Created: ${e.created_at}`)
      console.log('')
    })

    console.log(`Summary: ${createdEvents.length} created, ${canceledEvents.length} canceled`)
  } else {
    console.log('❌ FAIL: No booking events found')
    console.log('   Expected: booking_events row with event_type = "created"')
  }

  // Check customer profiles
  console.log('\n3. Customer profiles:')
  const { data: profiles, error: profilesError } = await supabase
    .from('customer_profile')
    .select('user_id, email, delivery_address, out_of_service_area')
    .limit(5)

  if (profilesError) {
    console.log('❌ Error:', profilesError.message)
  } else if (profiles && profiles.length > 0) {
    console.log(`✅ Found ${profiles.length} profile(s):\n`)
    profiles.forEach(p => {
      console.log(`   Email: ${p.email}`)
      console.log(`   User ID: ${p.user_id}`)
      console.log(`   Out of service area: ${p.out_of_service_area}`)
      console.log(`   Has address: ${p.delivery_address ? 'Yes' : 'No'}`)
      if (p.delivery_address) {
        console.log(`   Address: ${JSON.stringify(p.delivery_address)}`)
      }
      console.log('')
    })
  } else {
    console.log('⚠️  No customer profiles found')
    console.log('   Need to complete Stripe checkout or create profile manually')
  }
}

checkCalendlyBooking().catch(console.error)
