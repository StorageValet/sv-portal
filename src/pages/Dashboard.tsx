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

  const { data: items, isLoading } = useQuery({
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

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
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
  })

  const { data: insurance } = useQuery({
    queryKey: ['my-insurance'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('fn_my_insurance')
      if (error) throw error
      return (data && data[0]) || null
    },
  })

  const formatCurrency = (valueCents: number) =>
    `$${(valueCents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

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
              disabled={selectedHomeItems.length === 0}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Schedule Pickup ({selectedHomeItems.length})
            </button>
            <button
              onClick={handleScheduleRedelivery}
              disabled={selectedStoredItems.length === 0}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
