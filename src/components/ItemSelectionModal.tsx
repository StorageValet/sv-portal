import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase, getItemPhotoUrl } from '../lib/supabase'
import toast from 'react-hot-toast'

// Thumbnail component with React Query caching
function ItemThumbnail({ photoPath, label }: { photoPath: string; label: string }) {
  const { data: photoUrl, isLoading } = useQuery({
    queryKey: ['item-photo', photoPath],
    queryFn: () => getItemPhotoUrl(photoPath),
    enabled: !!photoPath,
    staleTime: 1000 * 60 * 50, // 50 minutes
  })

  if (isLoading) {
    return <div className="h-full w-full bg-slate-200 animate-pulse" />
  }

  if (!photoUrl) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-100">
        <svg className="h-6 w-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  return <img src={photoUrl} alt={label} className="h-full w-full object-cover" />
}

interface ItemSelectionModalProps {
  actionId: string
}

export default function ItemSelectionModal({ actionId }: ItemSelectionModalProps) {
  const navigate = useNavigate()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Fetch the action to verify ownership and get details
  const { data: action, isLoading: actionLoading, error: actionError } = useQuery({
    queryKey: ['action', actionId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('actions')
        .select('*')
        .eq('id', actionId)
        .single()

      if (error) throw new Error(error.message)
      if (data.user_id !== user.id) throw new Error('Unauthorized: Action does not belong to user')

      return data
    },
  })

  // Fetch all items for the current user
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })

  // Pre-populate selected items when editing existing booking
  useEffect(() => {
    if (action && !initialized) {
      const existingIds = new Set<string>()
      if (action.pickup_item_ids) {
        action.pickup_item_ids.forEach((id: string) => existingIds.add(id))
      }
      if (action.delivery_item_ids) {
        action.delivery_item_ids.forEach((id: string) => existingIds.add(id))
      }
      if (existingIds.size > 0) {
        setSelectedIds(existingIds)
      }
      setInitialized(true)
    }
  }, [action, initialized])

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // Get this booking's existing item IDs (for edit mode)
  const bookingPickupIds = new Set<string>(action?.pickup_item_ids || [])
  const bookingDeliveryIds = new Set<string>(action?.delivery_item_ids || [])

  // Partition items by status, INCLUDING scheduled items that belong to THIS booking
  // At Home section: 'home' items + 'scheduled' items in this booking's pickup_item_ids
  const homeItems = items?.filter(item =>
    item.status === 'home' ||
    (item.status === 'scheduled' && bookingPickupIds.has(item.id))
  ) || []

  // In Storage section: 'stored' items + 'scheduled' items in this booking's delivery_item_ids
  const storedItems = items?.filter(item =>
    item.status === 'stored' ||
    (item.status === 'scheduled' && bookingDeliveryIds.has(item.id))
  ) || []

  const toggleItem = (itemId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one item')
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/update-booking-items`, {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${session.access_token}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          action_id: actionId,
          selected_item_ids: Array.from(selectedIds)
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update booking')
      }

      toast.success(`Items added! ${result.summary.pickup_items} pickup, ${result.summary.delivery_items} delivery`)
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Failed to update booking:', error)
      toast.error(error.message || 'Failed to update booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (actionLoading || itemsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (actionError || !action) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Booking</h2>
        <p className="text-red-700 mb-4">
          {actionError instanceof Error ? actionError.message : 'Booking not found or you do not have access to it.'}
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Return to Dashboard
        </button>
      </div>
    )
  }

  if (!['pending_items', 'pending_confirmation'].includes(action.status)) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">Cannot Modify Items</h2>
        <p className="text-yellow-700 mb-4">
          This booking has status '{action.status}' and cannot be modified. Only bookings with status 'pending_items' or 'pending_confirmation' can be edited.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
        >
          Return to Dashboard
        </button>
      </div>
    )
  }

  const selectedCount = selectedIds.size
  const selectedHomeCount = homeItems.filter(item => selectedIds.has(item.id)).length
  const selectedStoredCount = storedItems.filter(item => selectedIds.has(item.id)).length

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm mb-4"
        >
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Items for Service</h1>
        <div className="flex items-center space-x-2 text-gray-600">
          <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-medium">{formatDateTime(action.scheduled_start)}</span>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How Item Selection Works</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li><strong>At Home</strong> items will be picked up from your address</li>
              <li><strong>In Storage</strong> items will be delivered to your address</li>
              <li>You can select items from both sections for a single service appointment</li>
            </ul>
          </div>
        </div>
      </div>

      {/* At Home Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="h-6 w-6 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          At Home ({homeItems.length})
        </h2>

        {homeItems.length === 0 ? (
          <p className="text-gray-500 italic">No items currently at home</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {homeItems.map(item => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedIds.has(item.id)
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="h-12 w-12 rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
                    {item.photo_paths?.[0] ? (
                      <ItemThumbnail photoPath={item.photo_paths[0]} label={item.label} />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <svg className="h-6 w-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium text-gray-900 truncate">{item.label}</h3>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleItem(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 flex-shrink-0 ml-2"
                      />
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                    {item.category && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* In Storage Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="h-6 w-6 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          In Storage ({storedItems.length})
        </h2>

        {storedItems.length === 0 ? (
          <p className="text-gray-500 italic">No items currently in storage</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storedItems.map(item => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedIds.has(item.id)
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="h-12 w-12 rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
                    {item.photo_paths?.[0] ? (
                      <ItemThumbnail photoPath={item.photo_paths[0]} label={item.label} />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <svg className="h-6 w-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium text-gray-900 truncate">{item.label}</h3>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleItem(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 flex-shrink-0 ml-2"
                      />
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                    {item.category && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            <span className="font-semibold">{selectedCount} item(s) selected</span>
            {selectedCount > 0 && (
              <span className="ml-4 text-gray-600">
                {selectedHomeCount > 0 && `${selectedHomeCount} pickup`}
                {selectedHomeCount > 0 && selectedStoredCount > 0 && ' • '}
                {selectedStoredCount > 0 && `${selectedStoredCount} delivery`}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedCount === 0 || isSubmitting}
              className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Confirming...' : 'Confirm Items'}
            </button>
          </div>
        </div>
      </div>

      {/* Spacer to prevent content from being hidden under fixed bar */}
      <div className="h-20"></div>
    </div>
  )
}
