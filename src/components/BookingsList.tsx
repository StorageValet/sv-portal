// Storage Valet — Bookings List Component
// v1.0 • Read-only display of customer bookings
//
// Uses: POST /functions/v1/bookings-list edge function
// No mutations, no cancel action (Step 3 spec)

import { useQuery } from '@tanstack/react-query'
import { fetchBookings, Booking } from '../lib/supabase'

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

export default function BookingsList() {
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

  if (isLoading) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-sv-midnight mb-3">My Bookings</h3>
        <div className="flex items-center justify-center py-8">
          <svg
            className="animate-spin h-6 w-6 text-sv-terracotta"
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
        <h3 className="text-lg font-semibold text-sv-midnight mb-3">My Bookings</h3>
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-800 text-sm">
            Failed to load bookings. Please try refreshing the page.
          </p>
        </div>
      </div>
    )
  }

  const sortedBookings = sortBookings(bookings || [])

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-sv-midnight mb-3">My Bookings</h3>

      {sortedBookings.length === 0 ? (
        <div className="border border-dashed border-sv-sand rounded-lg p-6 text-center bg-sv-ivory">
          <svg
            className="mx-auto h-10 w-10 text-sv-terracotta/40 mb-3"
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
          <p className="text-sv-slate">You have no scheduled bookings.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedBookings.map((booking) => (
            <div key={booking.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Date and time */}
                  <div className="flex items-center space-x-2 mb-2">
                    <svg
                      className="h-5 w-5 text-sv-terracotta"
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
                    <p className="text-sm font-semibold text-sv-midnight">
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
