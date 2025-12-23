import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

type ActionStatus = 'pending_items' | 'pending_confirmation' | 'confirmed' | 'completed' | 'canceled'
type FilterTab = 'upcoming' | 'today' | 'completed'

interface CustomerProfile {
  full_name: string | null
  email: string
  delivery_address: { postal_code?: string } | null
}

interface Action {
  id: string
  service_type: 'pickup' | 'redelivery' | 'container_delivery'
  status: ActionStatus
  scheduled_start: string
  scheduled_end: string
  pickup_item_ids: string[] | null
  delivery_item_ids: string[] | null
  customer_profile: CustomerProfile | CustomerProfile[] | null
}

// Helper to extract error message from Supabase PostgrestError or generic Error
function getStaffErrorMessage(err: unknown): string {
  if (!err) return 'Unknown error'

  // Log full error to console for debugging
  console.error('Full staffError object:', err)

  // Try common error properties
  const anyErr = err as Record<string, unknown>

  if (typeof anyErr.message === 'string' && anyErr.message.length > 0) {
    return anyErr.message
  }
  if (typeof anyErr.details === 'string' && anyErr.details.length > 0) {
    return anyErr.details
  }
  if (typeof anyErr.hint === 'string' && anyErr.hint.length > 0) {
    return anyErr.hint
  }
  if (typeof anyErr.code === 'string') {
    return `Error code: ${anyErr.code}`
  }

  // Fallback to JSON dump
  try {
    return JSON.stringify(err, null, 2)
  } catch {
    return 'Unknown error (not serializable)'
  }
}

export default function Ops() {
  const [filter, setFilter] = useState<FilterTab>('upcoming')
  const queryClient = useQueryClient()

  // Staff gate: Check if current user is staff via sv.is_staff() RPC
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
    staleTime: Infinity,
  })

  const { data: isStaff, isLoading: staffLoading, error: staffError } = useQuery({
    queryKey: ['staff-check', user?.id],
    queryFn: async () => {
      if (!user) return false
      // Call public.is_staff() which wraps sv.is_staff()
      const { data, error } = await supabase.rpc('is_staff')
      if (error) {
        console.error('is_staff RPC error:', error)
        throw error
      }
      return data === true
    },
    enabled: !!user,
  })

  // Fetch actions with customer info
  const { data: actions, isLoading: actionsLoading } = useQuery({
    queryKey: ['ops-actions', filter],
    queryFn: async () => {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

      let query = supabase
        .from('actions')
        .select(`
          id, service_type, status, scheduled_start, scheduled_end,
          pickup_item_ids, delivery_item_ids,
          customer_profile:user_id (full_name, email, delivery_address)
        `)
        .neq('status', 'canceled')
        .order('scheduled_start', { ascending: true })

      if (filter === 'upcoming') {
        query = query.gte('scheduled_start', now.toISOString()).neq('status', 'completed')
      } else if (filter === 'today') {
        query = query.gte('scheduled_start', todayStart).lt('scheduled_start', todayEnd)
      } else if (filter === 'completed') {
        query = query.eq('status', 'completed')
      }

      const { data, error } = await query
      if (error) throw error
      return data as Action[]
    },
    enabled: isStaff === true,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  })

  // Mark action as completed via complete-service edge function
  // This properly updates item statuses (pickup→stored, delivery→home)
  const completeMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/complete-service`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action_id: actionId }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to complete service')
      }

      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ops-actions'] })
      toast.success(data.message || 'Service marked as completed')
    },
    onError: (error: Error) => {
      toast.error(`Failed to complete: ${error.message}`)
    },
  })

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

  const getStatusBadge = (status: ActionStatus) => {
    const styles: Record<ActionStatus, string> = {
      pending_items: 'bg-amber-100 text-amber-800',
      pending_confirmation: 'bg-sv-bone text-sv-slate',
      confirmed: 'bg-sv-slate text-sv-cream',
      completed: 'bg-green-100 text-green-800',
      canceled: 'bg-red-100 text-red-800',
    }
    const labels: Record<ActionStatus, string> = {
      pending_items: 'Awaiting Items',
      pending_confirmation: 'Pending',
      confirmed: 'Confirmed',
      completed: 'Completed',
      canceled: 'Canceled',
    }
    return (
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const getTypeBadge = (type: string) => {
    // Using Brand v1.1 tokens for type differentiation
    const styles: Record<string, string> = {
      pickup: 'bg-sv-navy/10 text-sv-navy',           // Navy for pickups
      redelivery: 'bg-sv-peach/30 text-sv-ember',     // Terracotta family for redeliveries
      container_delivery: 'bg-sv-slate/10 text-sv-slate', // Slate for containers
    }
    return (
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[type] || 'bg-sv-bone'}`}>
        {type === 'container_delivery' ? 'Container' : type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    )
  }

  // Loading state
  if (staffLoading) {
    return (
      <div className="min-h-screen bg-sv-cream flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-sv-slate mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sv-slate/70">Checking access...</p>
        </div>
      </div>
    )
  }

  // Error state - RPC failed
  if (staffError) {
    return (
      <div className="min-h-screen bg-sv-cream flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-sv-midnight mb-2">Error Verifying Access</h2>
          <p className="text-sv-midnight/70 mb-4">
            Unable to verify staff access. Please contact support if this persists.
          </p>
          <pre className="text-xs text-red-600 mb-4 font-mono bg-red-50 p-2 rounded text-left whitespace-pre-wrap break-all max-h-40 overflow-auto">
            {getStaffErrorMessage(staffError)}
          </pre>
          <a href="/dashboard" className="btn-primary inline-block">
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

  // Access denied
  if (!isStaff) {
    return (
      <div className="min-h-screen bg-sv-cream flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-sv-midnight mb-2">Access Denied</h2>
          <p className="text-sv-midnight/70 mb-4">
            This page is restricted to Storage Valet staff members.
          </p>
          <a href="/dashboard" className="btn-primary inline-block">
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

  // Staff dashboard
  return (
    <div className="min-h-screen bg-sv-cream">
      <header className="bg-sv-midnight text-sv-ivory py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">Operations Dashboard</h1>
          <a href="/dashboard" className="text-sm text-sv-ivory/80 hover:text-sv-ivory underline">
            ← Customer Portal
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-sv-bone rounded-lg p-1 mb-6 w-fit">
          {(['upcoming', 'today', 'completed'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === tab
                  ? 'bg-sv-cream shadow-sm text-sv-slate'
                  : 'text-sv-slate/70 hover:text-sv-slate'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Auto-refresh indicator */}
        <p className="text-xs text-sv-slate/60 mb-4">Auto-refreshes every 30 seconds</p>

        {/* Actions List */}
        {actionsLoading ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-8 w-8 text-sv-slate mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sv-midnight/70">Loading actions...</p>
          </div>
        ) : actions && actions.length > 0 ? (
          <div className="space-y-4">
            {actions.map((action) => {
              const itemCount = (action.pickup_item_ids?.length || 0) + (action.delivery_item_ids?.length || 0)

              // Handle both single object and array from Supabase join
              const profileData = Array.isArray(action.customer_profile)
                ? action.customer_profile[0]
                : action.customer_profile

              return (
                <div key={action.id} className="card">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Badges */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {getTypeBadge(action.service_type)}
                        {getStatusBadge(action.status)}
                      </div>

                      {/* Customer Info */}
                      <p className="font-semibold text-sv-midnight">
                        {profileData?.full_name || 'Unknown'} {profileData?.delivery_address?.postal_code && <span className="text-sv-slate/60 font-normal">({profileData.delivery_address.postal_code})</span>}
                      </p>
                      <p className="text-sm text-sv-midnight/70">{profileData?.email}</p>

                      {/* Schedule */}
                      <p className="text-sm text-sv-midnight/70 mt-2">
                        <svg className="inline-block h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDateTime(action.scheduled_start)}
                      </p>

                      {/* Items */}
                      <p className="text-sm text-sv-slate/70 mt-1">
                        {itemCount} item{itemCount !== 1 ? 's' : ''}
                        {action.pickup_item_ids?.length ? ` (${action.pickup_item_ids.length} pickup)` : ''}
                        {action.delivery_item_ids?.length ? ` (${action.delivery_item_ids.length} delivery)` : ''}
                      </p>
                    </div>

                    {/* Actions */}
                    {action.status !== 'completed' && (
                      <button
                        onClick={() => completeMutation.mutate(action.id)}
                        disabled={completeMutation.isPending}
                        className="btn-primary disabled:opacity-60"
                      >
                        {completeMutation.isPending ? 'Completing...' : 'Mark Completed'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card text-center py-12">
            <svg className="mx-auto h-10 w-10 text-sv-slate/40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sv-midnight/70">
              {filter === 'upcoming' && 'No upcoming actions'}
              {filter === 'today' && 'No actions scheduled for today'}
              {filter === 'completed' && 'No completed actions yet'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
