// Storage Valet — Bookings List Component
// v2.0 • Consolidated booking display with actions, history toggle, and CTAs
//
// Uses: POST /functions/v1/bookings-list (read)
//       POST /functions/v1/booking-cancel (cancel)

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchBookings, cancelBooking, Booking } from '../lib/supabase'

interface BookingsListProps {
  onBookAppointment?: () => void
  isPastDue?: boolean
}

// Customer-cancelable states (must match edge function)
const CANCELABLE_STATES = ['pending_items', 'pending_confirmation']

// Status label mapping (UI only)
const STATUS_LABELS: Record<string, string> = {
  pending_items: 'Needs items',
  pending_confirmation: 'Awaiting confirmation',
  confirmed: 'Confirmed',
  canceled: 'Canceled',
  completed: 'Completed',
  in_progress: 'In Progress',
}

// Status badge colors
const STATUS_COLORS: Record<string, string> = {
  pending_items: 'bg-amber-100 text-amber-800',
  pending_confirmation: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  canceled: 'bg-sv-bone text-sv-slate',
  completed: 'bg-sv-bone text-sv-slate',
  in_progress: 'bg-purple-100 text-purple-800',
}

function formatDate(isoString: string | null): string {
  if (!isoString) return 'Not scheduled'
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTimeRange(start: string | null, end: string | null): string {
  if (!start) return ''
  const startDate = new Date(start)
  const startTime = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  if (!end) return startTime

  const endDate = new Date(end)
  const endTime = endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return `${startTime} – ${endTime}`
}

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status
}

function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || 'bg-sv-bone text-sv-slate'
}

function isCancelable(status: string): boolean {
  return CANCELABLE_STATES.includes(status)
}

function sortBookings(bookings: Booking[]): Booking[] {
  const now = new Date()

  // Separate upcoming and past bookings
  const upcoming: Booking[] = []
  const past: Booking[] = []

  for (const booking of bookings) {
    if (!booking.scheduled_start) {
      upcoming.push(booking) // Unscheduled goes to upcoming
    } else if (new Date(booking.scheduled_start) >= now) {
      upcoming.push(booking)
    } else {
      past.push(booking)
    }
  }

  // Sort upcoming by scheduled_start ASC
  upcoming.sort((a, b) => {
    if (!a.scheduled_start) return 1
    if (!b.scheduled_start) return -1
    return new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
  })

  // Sort past by scheduled_start DESC (most recent first)
  past.sort((a, b) => {
    if (!a.scheduled_start) return 1
    if (!b.scheduled_start) return -1
    return new Date(b.scheduled_start).getTime() - new Date(a.scheduled_start).getTime()
  })

  return [...upcoming, ...past]
}

export default function BookingsList({ onBookAppointment, isPastDue = false }: BookingsListProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const {
    data: bookings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['bookings-list'],
    queryFn: fetchBookings,
    staleTime: 30000, // 30 seconds - freshness matters
    refetchOnWindowFocus: true,
  })

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),
    onSuccess: () => {
      // Invalidate bookings list to refresh
      queryClient.invalidateQueries({ queryKey: ['bookings-list'] })
      // Also invalidate items since their status may have reverted
      queryClient.invalidateQueries({ queryKey: ['items'] })
      setCancelTarget(null)
    },
    onError: (err) => {
      console.error('Cancel booking failed:', err)
      // Keep dialog open so user sees error
    },
  })

  const handleCancelClick = (booking: Booking) => {
    setCancelTarget(booking)
  }

  const handleConfirmCancel = () => {
    if (cancelTarget) {
      cancelMutation.mutate(cancelTarget.id)
    }
  }

  const handleCloseDialog = () => {
    if (!cancelMutation.isPending) {
      setCancelTarget(null)
      cancelMutation.reset()
    }
  }

  // Defensive: ensure bookings is always an array
  const safeBookings = Array.isArray(bookings) ? bookings : []
  const sortedBookings = sortBookings(safeBookings)

  // Separate upcoming and past bookings for history toggle
  // NOTE: This useMemo MUST be called before any early returns
  const now = new Date()
  const { upcomingBookings, pastBookings } = useMemo(() => {
    const upcoming: Booking[] = []
    const past: Booking[] = []

    for (const booking of sortedBookings) {
      if (!booking.scheduled_start) {
        upcoming.push(booking) // Unscheduled goes to upcoming
      } else if (new Date(booking.scheduled_start) >= now) {
        upcoming.push(booking)
      } else {
        past.push(booking)
      }
    }

    return { upcomingBookings: upcoming, pastBookings: past }
  }, [sortedBookings])

  // Display bookings based on history toggle
  const displayedBookings = showHistory
    ? [...upcomingBookings, ...pastBookings]
    : upcomingBookings

  if (isLoading) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-sv-deep-teal mb-3">My Bookings</h3>
        <div className="flex items-center justify-center py-8">
          <svg
            className="animate-spin h-6 w-6 text-sv-accent"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="ml-2 text-sv-slate">Loading bookings...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-sv-deep-teal mb-3">My Bookings</h3>
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-800 text-sm">
            Failed to load bookings. Please try refreshing the page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-sv-deep-teal">My Bookings</h3>
        <div className="flex items-center space-x-3">
          {pastBookings.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-sm text-sv-accent hover:text-sv-deep-teal transition-colors"
            >
              {showHistory ? 'Hide history' : `Show history (${pastBookings.length})`}
            </button>
          )}
          {onBookAppointment && (
            <button
              onClick={onBookAppointment}
              disabled={isPastDue}
              className={`btn-primary inline-flex items-center ${isPastDue ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isPastDue ? 'Update your payment method to schedule new services' : ''}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Book Appointment
            </button>
          )}
        </div>
      </div>

      {displayedBookings.length === 0 ? (
        <div className="border border-dashed border-sv-sand rounded-lg p-6 text-center bg-sv-ivory">
          <svg
            className="mx-auto h-10 w-10 text-sv-accent/40 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sv-slate mb-2">No upcoming appointments</p>
          <p className="text-sm text-sv-slate">Click "Book Appointment" to schedule a pickup or delivery</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedBookings.map((booking) => {
            const isPast = booking.scheduled_start && new Date(booking.scheduled_start) < now
            return (
              <div key={booking.id} className={`card ${isPast ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Date and time */}
                    <div className="flex items-center space-x-2 mb-2">
                      <svg
                        className="h-5 w-5 text-sv-accent"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm font-semibold text-sv-deep-teal">
                        {formatDate(booking.scheduled_start)}
                      </p>
                      {booking.scheduled_start && (
                        <span className="text-sm text-sv-slate">
                          {formatTimeRange(booking.scheduled_start, booking.scheduled_end)}
                        </span>
                      )}
                    </div>

                    {/* Service type and status */}
                    <div className="flex items-center space-x-3 text-sm">
                      <span className="capitalize text-sv-slate">
                        {booking.service_type}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {getStatusLabel(booking.status)}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center space-x-2 ml-4">
                    {/* Add Items button for pending_items */}
                    {booking.status === 'pending_items' && (
                      <button
                        onClick={() => navigate(`/schedule?action_id=${booking.id}`)}
                        className="btn-primary text-sm px-3 py-1.5"
                      >
                        Add Items
                      </button>
                    )}

                    {/* Edit Items button for pending_confirmation */}
                    {booking.status === 'pending_confirmation' && (
                      <button
                        onClick={() => navigate(`/schedule?action_id=${booking.id}`)}
                        className="btn-secondary text-sm px-3 py-1.5"
                      >
                        Edit Items
                      </button>
                    )}

                    {/* Cancel button (only for cancelable states) */}
                    {isCancelable(booking.status) && (
                      <button
                        onClick={() => handleCancelClick(booking)}
                        className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/30 transition-opacity"
              onClick={handleCloseDialog}
            />

            {/* Dialog */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-sv-deep-teal mb-2">
                Cancel Booking?
              </h3>
              <p className="text-sv-slate text-sm mb-4">
                Are you sure you want to cancel this{' '}
                <span className="font-medium">{cancelTarget.service_type}</span>
                {cancelTarget.scheduled_start && (
                  <>
                    {' '}scheduled for{' '}
                    <span className="font-medium">
                      {formatDate(cancelTarget.scheduled_start)}
                    </span>
                  </>
                )}
                ? Any items associated with this booking will be returned to their previous status.
              </p>

              {cancelMutation.isError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">
                    {cancelMutation.error instanceof Error
                      ? cancelMutation.error.message
                      : 'Failed to cancel booking. Please try again.'}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseDialog}
                  disabled={cancelMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-sv-slate hover:text-sv-deep-teal disabled:opacity-50"
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={cancelMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 flex items-center"
                >
                  {cancelMutation.isPending ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Canceling...
                    </>
                  ) : (
                    'Yes, Cancel Booking'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
