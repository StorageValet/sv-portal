// Imports:
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import AddItemModal from '../components/AddItemModal'

// Inside component body:
const [openAdd, setOpenAdd] = useState(false)
const { data: insurance } = useQuery({
  queryKey: ['my-insurance'],
  queryFn: async () => {
    const { data, error } = await supabase.rpc('fn_my_insurance')
    if (error) throw error
    return (data && data[0]) || null
  }
})

// Insurance bar (place above items grid):
{insurance && (
  <div className="mb-6 p-4 rounded border border-subtle bg-secondary">
    <div className="flex items-center justify-between mb-2">
      <span className="text-velvet-night font-medium">Insurance Coverage</span>
      <span className="text-deep-harbor text-sm">$3,000 plan</span>
    </div>
    <div className="w-full h-2 bg-chalk-linen rounded">
      <div
        className="h-2 bg-velvet-night rounded transition-all"
        style={{ width: `${Math.round((insurance?.remaining_ratio ?? 1) * 100)}%` }}
      />
    </div>
    <div className="mt-2 text-deep-harbor text-xs">Remaining coverage shown as a bar</div>
  </div>
)}

// FAB + modal (place near end of page container):
<button
  onClick={() => setOpenAdd(true)}
  className="fixed bottom-6 right-6 rounded-full w-14 h-14 bg-velvet-night text-pebble-linen shadow-lg hover:shadow-xl text-2xl"
  aria-label="Add Item"
>
  +
</button>
{openAdd && <AddItemModal onClose={() => setOpenAdd(false)} />}
