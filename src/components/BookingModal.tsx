import { useState, useEffect, useCallback, useRef } from 'react'
import { PopupModal, useCalendlyEventListener } from 'react-calendly'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Use env var for Calendly URL, fallback to default
const CALENDLY_URL = import.meta.env.VITE_CALENDLY_URL ?? 'https://calendly.com/zach-mystoragevalet'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  profile: { email: string; full_name: string | null }
  userId: string
}

type BookingState =
  | { status: 'idle' }
  | { status: 'processing'; eventUri: string }
  | { status: 'success'; actionId: string }
  | { status: 'timeout' }
  | { status: 'error'; message: string }

export default function BookingModal({ isOpen, onClose, profile, userId }: BookingModalProps) {
  const navigate = useNavigate()
  const [bookingState, setBookingState] = useState<BookingState>({ status: 'idle' })

  // Ref to cancel polling cleanly on close (prevents setState after unmount/close)
  const cancelledRef = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Reset cancelled flag when modal opens
  useEffect(() => {
    if (isOpen) {
      cancelledRef.current = false
    }
  }, [isOpen])

  // Listen for Calendly booking completion - fires immediately when user confirms
  useCalendlyEventListener({
    onEventScheduled: (e) => {
      // Immediate ACK: Show "Booking received" with spinner right away
      // This happens even if webhook takes 10-30 seconds
      const eventUri = e.data.payload.event.uri
      setBookingState({ status: 'processing', eventUri })
    }
  })

  // Poll for action record when processing
  useEffect(() => {
    if (bookingState.status !== 'processing') return

    let attempts = 0
    const maxAttempts = 40 // 60 seconds at 1.5s intervals

    const poll = async () => {
      // Check if cancelled before doing anything
      if (cancelledRef.current) return

      // Use maybeSingle() to avoid console errors when row doesn't exist yet
      const { data } = await supabase
        .from('actions')
        .select('id')
        .eq('calendly_event_uri', bookingState.eventUri)
        .eq('user_id', userId)
        .maybeSingle()

      // Check again after async operation
      if (cancelledRef.current) return

      if (data?.id) {
        // Found the action record
        setBookingState({ status: 'success', actionId: data.id })
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }

        // After showing success checkmark, close modal and navigate
        // Use handleClose() to ensure proper cleanup
        setTimeout(() => {
          if (!cancelledRef.current) {
            onClose()
            setBookingState({ status: 'idle' })
            navigate(`/schedule?action_id=${data.id}`)
          }
        }, 1500)
        return
      }

      // Not found yet - keep polling or timeout
      attempts++
      if (attempts >= maxAttempts && !cancelledRef.current) {
        setBookingState({ status: 'timeout' })
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }

    // Start polling
    poll() // Initial check
    intervalRef.current = setInterval(poll, 1500)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [bookingState, userId, navigate, onClose])

  // Handle modal close - reset state and cancel polling
  const handleClose = useCallback(() => {
    // Mark as cancelled to prevent background setState
    cancelledRef.current = true

    // Clear any running interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Only allow close if not in the middle of success navigation
    if (bookingState.status !== 'success') {
      setBookingState({ status: 'idle' })
      onClose()
    }
  }, [bookingState.status, onClose])

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && bookingState.status !== 'success') {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, handleClose, bookingState.status])

  // Don't render anything if not open
  if (!isOpen) return null

  // CTO Requirement: Always render PopupModal when isOpen
  // Layer processing/success/timeout UI on TOP of the modal (not replacing it)
  return (
    <>
      {/* Calendly PopupModal - always rendered when isOpen */}
      <PopupModal
        url={CALENDLY_URL}
        onModalClose={handleClose}
        open={isOpen}
        rootElement={document.getElementById('root')!}
        prefill={{
          email: profile.email,
          name: profile.full_name || '',
          firstName: profile.full_name?.split(' ')[0] || ''
        }}
        pageSettings={{
          backgroundColor: 'f8f6f2',  // sv-cream
          primaryColor: 'D97757',     // sv-terracotta
          textColor: '0f2942'         // sv-midnight
        }}
      />

      {/* Processing/Success/Timeout overlay - layered on TOP of Calendly modal */}
      {bookingState.status !== 'idle' && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-status-title"
        >
          <div className="bg-sv-cream rounded-lg p-6 sm:p-8 max-w-sm w-full mx-auto text-center shadow-xl">
            {/* Processing State - Immediate ACK */}
            {bookingState.status === 'processing' && (
              <>
                <div className="animate-spin h-12 w-12 border-4 border-sv-terracotta border-t-transparent rounded-full mx-auto mb-4" />
                <h3 id="booking-status-title" className="text-lg font-semibold text-sv-midnight mb-2">
                  Booking Received!
                </h3>
                <p className="text-sv-slate text-sm">Setting up your appointment...</p>
              </>
            )}

            {/* Success State */}
            {bookingState.status === 'success' && (
              <>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 id="booking-status-title" className="text-lg font-semibold text-sv-midnight mb-2">
                  All Set!
                </h3>
                <p className="text-sv-slate text-sm">Redirecting to add items...</p>
              </>
            )}

            {/* Timeout State */}
            {bookingState.status === 'timeout' && (
              <>
                <div className="h-12 w-12 bg-sv-bone rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-6 w-6 text-sv-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 id="booking-status-title" className="text-lg font-semibold text-sv-midnight mb-2">
                  Booking Received
                </h3>
                <p className="text-sv-slate text-sm mb-4">
                  It may take a moment to appear. Please refresh your dashboard.
                </p>
                <button
                  onClick={handleClose}
                  className="btn-primary"
                >
                  Close
                </button>
              </>
            )}

            {/* Error State */}
            {bookingState.status === 'error' && (
              <>
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 id="booking-status-title" className="text-lg font-semibold text-sv-midnight mb-2">
                  Something went wrong
                </h3>
                <p className="text-sv-slate text-sm mb-4">{bookingState.message}</p>
                <button
                  onClick={handleClose}
                  className="btn-primary"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
