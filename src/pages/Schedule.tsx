import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Schedule() {
  const [kind, setKind] = useState<'pickup' | 'delivery'>('pickup')
  const [scheduledAt, setScheduledAt] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('actions').insert({
      user_id: user.id,
      kind,
      scheduled_at: scheduledAt,
      status: 'pending',
      details: { notes },
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      setSuccess(true)
      setScheduledAt('')
      setNotes('')
    }

    setLoading(false)
  }

  // Minimum notice: 48 hours from now
  const minDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold">Storage Valet</h1>
            <div className="flex gap-4">
              <Link to="/dashboard" className="text-gray-700 hover:text-brand-600">
                Dashboard
              </Link>
              <Link to="/schedule" className="text-gray-700 hover:text-brand-600">
                Schedule
              </Link>
              <Link to="/account" className="text-gray-700 hover:text-brand-600">
                Account
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-6">Schedule Pickup or Delivery</h2>

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">
            Request submitted successfully! We'll confirm your appointment soon.
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="pickup"
                  checked={kind === 'pickup'}
                  onChange={() => setKind('pickup')}
                  className="mr-2"
                />
                Pickup
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="delivery"
                  checked={kind === 'delivery'}
                  onChange={() => setKind('delivery')}
                  className="mr-2"
                />
                Delivery
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Date & Time
            </label>
            <input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={minDate}
              className="input"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 48 hours notice required</p>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input"
              placeholder="Any special instructions..."
            />
          </div>

          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Service available as needed, with 48-hour advance notice
        </p>
      </main>
    </div>
  )
}
