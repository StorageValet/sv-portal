import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { supabase } from '../lib/supabase'
import ItemCard from '../components/ItemCard'
import AddItemModal from '../components/AddItemModal'
import EditItemModal from '../components/EditItemModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import ItemDetailModal from '../components/ItemDetailModal'
import WaitlistDashboard from '../components/WaitlistDashboard'

export default function Dashboard() {
  const navigate = useNavigate()
  const [openAdd, setOpenAdd] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [viewingItemId, setViewingItemId] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  // Sprint 3: Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'home' | 'in_transit' | 'stored'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Debounce search input (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Centralized user query (runs once, cached)
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
    staleTime: Infinity, // User won't change during session
  })

  // Load profile (depends on user)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null

      const { data, error } = await supabase
        .from('customer_profile')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.warn('Profile query error:', error.message)
        return null
      }
      return data
    },
    enabled: !!user,
  })

  // Check if user is out of service area (waitlist)
  const isWaitlist = profile?.out_of_service_area === true

  // Load items (depends on user and profile)
  const { data: items, isLoading } = useQuery({
    queryKey: ['items', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      // Fetch only items belonging to this user (SECURITY: user_id filter)
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!user && !!profile && !isWaitlist,
  })

  // Load insurance (depends on profile)
  const { data: insurance } = useQuery({
    queryKey: ['my-insurance'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('fn_my_insurance')
      if (error) throw error
      return (data && data[0]) || null
    },
    enabled: !!user && !!profile && !isWaitlist,
  })

  // Query pending bookings (schedule-first flow)
  const { data: pendingBookings } = useQuery({
    queryKey: ['pending-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('actions')
        .select('id, scheduled_start, scheduled_end, status, pickup_item_ids, delivery_item_ids')
        .in('status', ['pending_items', 'pending_confirmation', 'confirmed'])
        .gte('scheduled_start', new Date().toISOString())
        .order('scheduled_start', { ascending: true })

      if (error) {
        console.warn('Pending bookings query error:', error.message)
        return []
      }
      return data || []
    },
  })

  const formatCurrency = (valueCents: number) =>
    `$${(valueCents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // Service area gating logic
  const hasAddress = profile?.delivery_address && Object.keys(profile.delivery_address).length > 0
  const isOutOfServiceArea = profile?.out_of_service_area === true
  const canSchedule = hasAddress && !isOutOfServiceArea

  const insuranceCapCents = insurance?.insurance_cap_cents ?? 0
  const totalItemValueCents = insurance?.total_item_value_cents ?? 0
  const remainingCents = Math.max(0, insurance?.remaining_cents ?? (insuranceCapCents - totalItemValueCents))
  const usedRatio = insuranceCapCents > 0 ? Math.min(totalItemValueCents / insuranceCapCents, 1) : 0

  // Sprint 3: Filter and search items
  const filteredItems = useMemo(() => {
    if (!items) return []

    let filtered = items

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase()
      filtered = filtered.filter(item =>
        item.label?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.qr_code?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter)
    }

    return filtered
  }, [items, debouncedSearch, statusFilter, categoryFilter])

  const categories = useMemo(() => {
    if (!items) return []
    const uniqueCategories = new Set(
      items.map(item => item.category).filter((cat): cat is string => !!cat)
    )
    return Array.from(uniqueCategories).sort()
  }, [items])

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev)
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId)
      } else {
        newSelection.add(itemId)
      }
      return newSelection
    })
  }

  const handleClearSelection = () => {
    setSelectedItems(new Set())
  }

  const selectedHomeItems = useMemo(() => {
    return filteredItems?.filter(item => selectedItems.has(item.id) && item.status === 'home') || []
  }, [filteredItems, selectedItems])

  const selectedStoredItems = useMemo(() => {
    return filteredItems?.filter(item => selectedItems.has(item.id) && item.status === 'stored') || []
  }, [filteredItems, selectedItems])

  const handleSchedulePickup = () => {
    navigate('/schedule', { state: { selectedItemIds: Array.from(selectedItems), action: 'pickup' } })
  }

  const handleScheduleRedelivery = () => {
    navigate('/schedule', { state: { selectedItemIds: Array.from(selectedItems), action: 'redelivery' } })
  }

  // Show waitlist dashboard if user is out of service area
  if (isWaitlist) {
    return <WaitlistDashboard profile={profile} />
  }

  // Normal dashboard for in-service-area customers
  return (
    <AppLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Your Items</h2>
        {profile && (
          <p className="text-gray-600">
            Subscription: <span className="font-medium capitalize">{profile.subscription_status}</span>
          </p>
        )}
      </div>

      {/* Service Area Alert (if out of area or missing address) */}
      {!profileLoading && !canSchedule && (
        <div className="mb-6 p-4 rounded-lg border bg-yellow-50 border-yellow-200">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              {!hasAddress && (
                <>
                  <h3 className="text-sm font-semibold text-yellow-800 mb-1">Address Required</h3>
                  <p className="text-sm text-yellow-700">
                    Please add your delivery address in{' '}
                    <button onClick={() => navigate('/account')} className="underline font-medium hover:text-yellow-900">
                      Account Settings
                    </button>
                    {' '}before scheduling a service.
                  </p>
                </>
              )}
              {hasAddress && isOutOfServiceArea && (
                <>
                  <h3 className="text-sm font-semibold text-yellow-800 mb-1">Service Area Notice</h3>
                  <p className="text-sm text-yellow-700">
                    Your address is outside our primary service area. Our team will review your request manually.
                    Please contact{' '}
                    <a href="mailto:support@mystoragevalet.com" className="underline font-medium hover:text-yellow-900">
                      support@mystoragevalet.com
                    </a>
                    {' '}if you think this is an error.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Services Section - Always shown */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Services</h3>
          <a
            href="https://calendly.com/zach-mystoragevalet"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Book Appointment
          </a>
        </div>

        {pendingBookings && pendingBookings.length > 0 ? (
          <div className="space-y-3">
            {pendingBookings.map(booking => (
              <div key={booking.id} className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDateTime(booking.scheduled_start)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                        {booking.status === 'pending_items' ? 'Awaiting Items' :
                         booking.status === 'pending_confirmation' ? 'Pending Confirmation' :
                         'Confirmed'}
                      </span>
                      {booking.pickup_item_ids && booking.pickup_item_ids.length > 0 && (
                        <span>↑ {booking.pickup_item_ids.length} pickup</span>
                      )}
                      {booking.delivery_item_ids && booking.delivery_item_ids.length > 0 && (
                        <span>↓ {booking.delivery_item_ids.length} delivery</span>
                      )}
                    </div>
                  </div>
                  {booking.status === 'pending_items' && (
                    <button
                      onClick={() => navigate(`/schedule?action_id=${booking.id}`)}
                      className="ml-4 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 transition-colors"
                    >
                      Add Items
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
            <svg className="mx-auto h-10 w-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600 mb-2">No upcoming appointments</p>
            <p className="text-sm text-gray-500">Click "Book Appointment" to schedule a pickup or delivery</p>
          </div>
        )}
      </div>

      {insurance && (
        <div className="mb-6 p-4 rounded border border-gray-300 bg-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-velvet-night font-medium">Insurance Coverage</span>
            <span className="text-deep-harbor text-sm">{formatCurrency(insuranceCapCents)} plan</span>
          </div>
          <div className="w-full h-2 bg-chalk-linen rounded">
            <div
              className="h-2 bg-velvet-night rounded transition-all"
              style={{ width: `${Math.round(usedRatio * 100)}%` }}
            />
          </div>
          <div className="text-sm text-gray-600 mt-2 flex justify-between">
            <span>{formatCurrency(totalItemValueCents)} used</span>
            <span>{formatCurrency(remainingCents)} remaining</span>
          </div>
        </div>
      )}

      <div className="mb-6 space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search items by name, description, QR code, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Filters:</span>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="home">Home</option>
              <option value="in_transit">In Transit</option>
              <option value="stored">Stored</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={categories.length === 0}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setCategoryFilter('all')
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Grid View"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="List View"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {items && items.length > 0 && (
          <p className="text-sm text-gray-600">
            Showing {filteredItems.length} of {items.length} item{items.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {selectedItems.size > 0 && (
        <div className="bg-indigo-50 p-4 rounded-lg mb-6 border border-indigo-200 flex items-center justify-between flex-wrap gap-4">
          <p className="text-sm font-medium text-gray-700">
            {selectedItems.size} item(s) selected
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSchedulePickup}
              disabled={!canSchedule || selectedHomeItems.length === 0}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              title={!canSchedule ? 'Address required and must be in service area' : ''}
            >
              Schedule Pickup ({selectedHomeItems.length})
            </button>
            <button
              onClick={handleScheduleRedelivery}
              disabled={!canSchedule || selectedStoredItems.length === 0}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              title={!canSchedule ? 'Address required and must be in service area' : ''}
            >
              Schedule Redelivery ({selectedStoredItems.length})
            </button>
            <button
              onClick={handleClearSelection}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-gray-600">Loading your items...</div>
      ) : items && items.length > 0 ? (
        filteredItems.length > 0 ? (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                isSelected={selectedItems.has(item.id)}
                onSelect={handleSelectItem}
                onEdit={setEditingItemId}
                onDelete={setDeletingItemId}
                onViewDetails={setViewingItemId}
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : (
          <div className="card text-center">
            <p className="text-gray-600 mb-4">
              No items match your filters. Try adjusting your search or filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setCategoryFilter('all')
              }}
              className="btn-primary inline-block"
            >
              Clear Filters
            </button>
          </div>
        )
      ) : (
        <div className="card text-center">
          <p className="text-gray-600 mb-4">No items yet. Get started by adding your first item.</p>
          <button
            onClick={() => setOpenAdd(true)}
            className="btn-primary inline-block"
          >
            Add Item
          </button>
        </div>
      )}

      <button
        onClick={() => setOpenAdd(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 bg-velvet-night text-pebble-linen shadow-lg hover:shadow-xl text-2xl transition-shadow"
        aria-label="Add Item"
      >
        +
      </button>

      {openAdd && <AddItemModal onClose={() => setOpenAdd(false)} />}
      {editingItemId && <EditItemModal itemId={editingItemId} onClose={() => setEditingItemId(null)} />}
      {deletingItemId && <DeleteConfirmModal itemId={deletingItemId} onClose={() => setDeletingItemId(null)} />}
      {viewingItemId && <ItemDetailModal itemId={viewingItemId} onClose={() => setViewingItemId(null)} />}
    </AppLayout>
  )
}
