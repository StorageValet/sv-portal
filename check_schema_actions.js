import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://gmjucacmbrumncfnnhua.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtanVjYWNtYnJ1bW5jZm5uaHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNTkzMDgsImV4cCI6MjA3MzYzNTMwOH0.sR4S7DNrwxhi1C4HFnDzr0YL6IBqxzVwCGYtBDhSAFI'
)

async function checkSchema() {
  console.log('=== Checking actions table schema ===\n')

  // Try to select all columns
  const { data, error } = await supabase
    .from('actions')
    .select('*')
    .limit(1)

  if (error) {
    console.log('Error:', error.message)
  } else {
    if (data && data.length > 0) {
      console.log('Available columns:')
      console.log(Object.keys(data[0]))
    } else {
      console.log('No data in actions table')
    }
  }

  // Try to query with old column names
  const { data: test, error: testError } = await supabase
    .from('actions')
    .select('id, scheduled_at, status')
    .limit(1)

  if (testError) {
    console.log('\nError with scheduled_at:', testError.message)
  } else {
    console.log('\nscheduled_at exists:', test)
  }
}

checkSchema().catch(console.error)
