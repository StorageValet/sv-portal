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
import BookingModal from '../components/BookingModal'
import BookingsList from '../components/BookingsList'
import SelectionActionBar from '../components/SelectionActionBar'
import WaitlistDashboard from '../components/WaitlistDashboard'
import ErrorState from '../components/ErrorState'
import { isInServiceArea } from '../lib/serviceArea'

export default function Dashboard() {
  const navigate = useNavigate()
  const [openAdd, setOpenAdd] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [viewingItemId, setViewingItemId] = useState<string | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  // Sprint 3: Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'home' | 'scheduled' | 'stored'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Debounce search input (300ms delay per README spec)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)

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

  // === v4.0 Billing v2: Subscription status helpers ===
  const subscriptionStatus = profile?.subscription_status as string | undefined
  const trialEndAt = profile?.trial_end_at as string | undefined
  const cancelAtPeriodEnd = profile?.cancel_at_period_end as boolean | undefined
  const cancelAt = profile?.cancel_at as string | undefined

  // Determine if user is blocked from scheduling due to payment issues
  const isPastDue = subscriptionStatus === 'past_due'
  const isCanceled = subscriptionStatus === 'canceled'
  const isTrialing = subscriptionStatus === 'trialing'

  // Format trial end date for display
  const formatTrialEnd = (isoString: string | undefined): string => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Build subscription status display text
  const getSubscriptionDisplayText = (): string => {
    if (isTrialing && trialEndAt) {
      return `Free trial ends ${formatTrialEnd(trialEndAt)}`
    }
    if (subscriptionStatus === 'active') {
      return 'Active subscription'
    }
    if (isPastDue) {
      return 'Payment issue — update your card to continue'
    }
    if (isCanceled && cancelAtPeriodEnd && cancelAt) {
      return `Cancels on ${formatTrialEnd(cancelAt)}`
    }
    if (isCanceled) {
      return 'Subscription canceled'
    }
    if (subscriptionStatus === 'inactive') {
      return 'Awaiting first pickup'
    }
    return subscriptionStatus || 'Unknown'
  }

  // Get status badge color
  const getStatusBadgeClass = (): string => {
    if (isTrialing) return 'bg-green-100 text-green-800'
    if (subscriptionStatus === 'active') return 'bg-green-100 text-green-800'
    if (isPastDue) return 'bg-red-100 text-red-800'
    if (isCanceled) return 'bg-sv-stone/50 text-sv-slate'
    return 'bg-sv-bone text-sv-midnight'
  }

  // Load items (depends on user and profile)
  const { data: items, isLoading, error: itemsError, refetch: refetchItems } = useQuery({
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

  const formatCurrency = (valueCents: number) =>
    `$${(valueCents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  // Service area gating logic (CANONICAL FRONTEND CHECK)
  // Extract delivery address fields
  const deliveryAddress = profile?.delivery_address as { street?: string; zip?: string } | null | undefined
  const deliveryZip = deliveryAddress?.zip?.trim()
  const deliveryStreet = deliveryAddress?.street?.trim()

  // Determine if user has a complete address (street + zip required)
  const hasAddress = !!(deliveryStreet && deliveryZip)

  // Check if ZIP is in our launch service area (14 Hudson County ZIPs)
  const isInServiceAreaFrontEnd = hasAddress && isInServiceArea(deliveryZip)

  // User can schedule ONLY if they have an address AND are in service area AND not past_due
  // v4.0: past_due users must resolve payment before scheduling new services
  const canSchedule = hasAddress && isInServiceAreaFrontEnd && !isPastDue

  const insuranceCapCents = insurance?.insurance_cap_cents ?? 0
  const totalItemValueCents = insurance?.total_item_value_cents ?? 0
  const remainingCents = Math.max(0, insurance?.remaining_cents ?? (insuranceCapCents - totalItemValueCents))
  const usedRatio = insuranceCapCents > 0 ? Math.min(totalItemValueCents / insuranceCapCents, 1) : 0

  // Sprint 3: Filter and search items
  // Searches: label, description, QR code, category, tags (per README spec)
  const filteredItems = useMemo(() => {
    if (!items) return []

    let filtered = items

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase().trim()
      filtered = filtered.filter(item => {
        // Explicitly convert null/undefined to empty string for robust matching
        const label = (item.label || '').toLowerCase()
        const description = (item.description || '').toLowerCase()
        const qrCode = (item.qr_code || '').toLowerCase()
        const category = (item.category || '').toLowerCase()
        const tags = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : ''

        return (
          label.includes(query) ||
          description.includes(query) ||
          qrCode.includes(query) ||
          category.includes(query) ||
          tags.includes(query)
        )
      })
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter)
    }

    return filtered
  }, [items, debouncedSearch, statusFilter, categoryFilter])

  // ─────────────────────────────────────────────────────────────────────────────
  // SEARCH TEST PROTOCOL (for verification):
  // 1. Create item with unique word in TITLE only (e.g., "Flamingo Chair")
  // 2. Create item with unique word in DESCRIPTION only (e.g., desc: "basketball hoop")
  // 3. Search "Flamingo" → should find item 1
  // 4. Search "basketball" → should find item 2
  // 5. Both should respect status filter (All, Home, Scheduled, Stored)
  // ─────────────────────────────────────────────────────────────────────────────

  const categories = useMemo(() => {
    if (!items) return []
    const uniqueCategories = new Set(
      items.map(item => item.category).filter((cat): cat is string => !!cat)
    )
    return Array.from(uniqueCategories).sort()
  }, [items])

  const handleSelectItem = (itemId: string) => {
    // Prevent selecting scheduled items
    const item = items?.find(i => i.id === itemId)
    if (item?.status === 'scheduled') return

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
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass()}`}>
              {getSubscriptionDisplayText()}
            </span>
          </div>
        )}
      </div>

      {/* v4.0: Past Due Payment Banner */}
      {!profileLoading && profile && isPastDue && (
        <div className="mb-6 p-4 rounded-lg border-2 border-red-400 bg-red-50">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-900 mb-1">Payment Failed</h3>
              <p className="text-sm text-red-800 mb-2">
                We couldn't process your recent payment. Update your payment method to continue scheduling pickups and deliveries.
              </p>
              <button
                onClick={() => navigate('/account')}
                className="text-sm font-medium text-red-700 hover:text-red-900 underline"
              >
                Update Payment Method →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Area Gating - Three States */}
      {/* CASE A: No address yet - Blocking card */}
      {/* Only show when: profile loaded AND profile exists AND no address */}
      {!profileLoading && profile && !hasAddress && (
        <div className="mb-6 p-6 rounded-lg border-2 border-yellow-400 bg-yellow-50">
          <div className="flex items-start">
            <svg className="h-6 w-6 text-yellow-600 mt-0.5 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-yellow-900 mb-2">Add Your Delivery Address to Get Started</h3>
              <p className="text-sm text-yellow-800 mb-4">
                Storage Valet needs your delivery address to verify that you're in our service area and to schedule pickups and deliveries.
                This takes less than a minute to complete.
              </p>
              <button
                onClick={() => navigate('/account')}
                className="btn-primary bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-md font-medium"
              >
                Go to Account Settings →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CASE B: Address exists but out of service area - Warning card */}
      {/* Only show when: profile loaded AND profile exists AND has address AND out of area */}
      {!profileLoading && profile && hasAddress && !isInServiceAreaFrontEnd && (
        <div className="mb-6 p-6 rounded-lg border-2 border-red-400 bg-red-50">
          <div className="flex items-start">
            <svg className="h-6 w-6 text-red-600 mt-0.5 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-2">We're Not Servicing Your Area Yet</h3>
              <p className="text-sm text-red-800 mb-2">
                Unfortunately, your ZIP code ({deliveryZip}) is currently outside our active launch area in Hudson County, NJ.
              </p>
              <p className="text-sm text-red-800 mb-4">
                We're reviewing expansion plans regularly. If you believe this is an error, please contact us at{' '}
                <a href="mailto:support@mystoragevalet.com" className="underline font-semibold hover:text-red-900">
                  support@mystoragevalet.com
                </a>
                .
              </p>
              <p className="text-xs text-red-700 font-medium">
                You can update your address in Account Settings if you entered it incorrectly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CASE C: Valid address in service area - Normal dashboard (no blocking card) */}

      {/* My Bookings - Consolidated component with CTA and history toggle */}
      <BookingsList
        onBookAppointment={() => setIsBookingModalOpen(true)}
        isPastDue={isPastDue}
      />

      {insurance && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sv-deep-teal font-medium">Insurance Coverage</span>
            <span className="text-sv-accent text-sm">{formatCurrency(insuranceCapCents)} plan</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-sv-slate w-6">$0</span>
            <div className="flex-1 h-2 bg-sv-ivory rounded">
              <div
                className="h-2 bg-sv-accent rounded transition-all"
                style={{ width: `${Math.round(usedRatio * 100)}%` }}
              />
            </div>
            <span className="text-xs text-sv-slate w-12 text-right">{formatCurrency(insuranceCapCents)}</span>
          </div>
          <div className="text-sm text-sv-slate mt-2 flex justify-between">
            <span>{formatCurrency(totalItemValueCents)} used</span>
            <span>{formatCurrency(remainingCents)} remaining</span>
          </div>
          <p className="text-xs text-sv-slate mt-2">
            Coverage applies only to items currently in our possession (picked up through return delivery). Values update after pickup.
          </p>
        </div>
      )}

      <div className="mb-6 space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search items by name, description, QR code, category, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
          <svg className="absolute left-3 top-3 h-5 w-5 text-sv-accent/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-sm font-medium text-sv-deep-teal">Filters:</span>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 text-sm border border-sv-sand rounded-md bg-sv-ivory hover:bg-sv-bone focus:outline-none focus:ring-2 focus:ring-sv-accent"
            >
              <option value="all">All Status</option>
              <option value="home">Home</option>
              <option value="scheduled">Scheduled</option>
              <option value="stored">Stored</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-sv-sand rounded-md bg-sv-ivory hover:bg-sv-bone focus:outline-none focus:ring-2 focus:ring-sv-accent"
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
                className="px-3 py-1.5 text-sm text-sv-accent hover:text-sv-deep-teal underline"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1 bg-sv-bone rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-sv-ivory shadow-sm text-sv-brown' : 'text-sv-deep-teal/50 hover:text-sv-deep-teal'}`}
              title="Grid View"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-sv-ivory shadow-sm text-sv-brown' : 'text-sv-deep-teal/50 hover:text-sv-deep-teal'}`}
              title="List View"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {items && items.length > 0 && (
          <p className="text-sm text-sv-slate">
            Showing {filteredItems.length} of {items.length} item{items.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* SelectionActionBar - fixed at bottom */}
      <SelectionActionBar
        selectedCount={selectedItems.size}
        selectedHomeCount={selectedHomeItems.length}
        selectedStoredCount={selectedStoredItems.length}
        canSchedule={canSchedule}
        onSchedulePickup={handleSchedulePickup}
        onScheduleRedelivery={handleScheduleRedelivery}
        onClearSelection={handleClearSelection}
      />

      {itemsError ? (
        <ErrorState error={itemsError} onRetry={refetchItems} message="Failed to load items" />
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-sv-accent mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sv-slate">Loading your items...</p>
        </div>
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
            <p className="text-sv-slate mb-4">
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
          <p className="text-sv-slate mb-4">No items yet. Get started by adding your first item.</p>
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
        className="fixed bottom-24 right-6 rounded-full w-14 h-14 bg-sv-brown text-white shadow-lg hover:shadow-xl hover:bg-sv-brown-hover text-2xl transition-all z-30"
        aria-label="Add Item"
      >
        +
      </button>

      {openAdd && <AddItemModal onClose={() => setOpenAdd(false)} />}
      {editingItemId && <EditItemModal itemId={editingItemId} onClose={() => setEditingItemId(null)} />}
      {deletingItemId && <DeleteConfirmModal itemId={deletingItemId} onClose={() => setDeletingItemId(null)} />}
      {viewingItemId && <ItemDetailModal itemId={viewingItemId} onClose={() => setViewingItemId(null)} />}
      {profile && user && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          profile={{ email: profile.email || user.email || '', full_name: profile.full_name }}
          userId={user.id}
        />
      )}
    </AppLayout>
  )
}
