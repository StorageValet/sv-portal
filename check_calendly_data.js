import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://gmjucacmbrumncfnnhua.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtanVjYWNtYnJ1bW5jZm5uaHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNTkzMDgsImV4cCI6MjA3MzYzNTMwOH0.sR4S7DNrwxhi1C4HFnDzr0YL6IBqxzVwCGYtBDhSAFI'
)

async function checkData() {
  console.log('=== Checking Calendly-related data ===\n')

  // Check actions table
  console.log('1. Actions with calendly_event_uri:')
  const { data: actions, error: actionsError } = await supabase
    .from('actions')
    .select('id, user_id, status, calendly_event_uri, scheduled_start, scheduled_end, service_address')
    .not('calendly_event_uri', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5)

  if (actionsError) {
    console.log('Error:', actionsError.message)
  } else if (actions && actions.length > 0) {
    console.log('Found', actions.length, 'action(s):')
    actions.forEach(a => {
      console.log(`  - ID: ${a.id}`)
      console.log(`    Status: ${a.status}`)
      console.log(`    Calendly URI: ${a.calendly_event_uri}`)
      console.log(`    Scheduled: ${a.scheduled_start} to ${a.scheduled_end}`)
      console.log(`    Address:`, JSON.stringify(a.service_address))
      console.log('')
    })
  } else {
    console.log('No actions with Calendly events found')
  }

  // Check booking_events
  console.log('\n2. Recent booking_events:')
  const { data: events, error: eventsError } = await supabase
    .from('booking_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (eventsError) {
    console.log('Error:', eventsError.message)
  } else if (events && events.length > 0) {
    console.log('Found', events.length, 'event(s):')
    events.forEach(e => {
      console.log(`  - Action ID: ${e.action_id}`)
      console.log(`    Event Type: ${e.event_type}`)
      console.log(`    Metadata:`, JSON.stringify(e.metadata))
      console.log(`    Created: ${e.created_at}`)
      console.log('')
    })
  } else {
    console.log('No booking events found')
  }

  // Check customer profiles
  console.log('\n3. Customer profiles:')
  const { data: profiles, error: profilesError } = await supabase
    .from('customer_profile')
    .select('user_id, email, delivery_address, out_of_service_area, needs_manual_refund')
    .limit(5)

  if (profilesError) {
    console.log('Error:', profilesError.message)
  } else if (profiles && profiles.length > 0) {
    console.log('Found', profiles.length, 'profile(s):')
    profiles.forEach(p => {
      console.log(`  - Email: ${p.email}`)
      console.log(`    User ID: ${p.user_id}`)
      console.log(`    Out of service area: ${p.out_of_service_area}`)
      console.log(`    Needs manual refund: ${p.needs_manual_refund}`)
      console.log(`    Address:`, JSON.stringify(p.delivery_address))
      console.log('')
    })
  } else {
    console.log('No customer profiles found')
  }
}

checkData().catch(console.error)
