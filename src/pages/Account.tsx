import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Account() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

      if (error) throw error
      return data
    },
  })

  const handleManageBilling = async () => {
    setLoading(true)
    setError('')

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setError('Not authenticated')
        return
      }

      // Call create-portal-session Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portal session')
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

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
        <h2 className="text-2xl font-bold mb-6">Account Settings</h2>

        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-lg mb-4">Profile</h3>
            {profile && (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Email:</span>{' '}
                  <span className="font-medium">{profile.email}</span>
                </div>
                <div>
                  <span className="text-gray-600">Subscription:</span>{' '}
                  <span className="font-medium capitalize">{profile.subscription_status}</span>
                </div>
                <div>
                  <span className="text-gray-600">Member since:</span>{' '}
                  <span className="font-medium">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="font-semibold text-lg mb-4">Billing</h3>
            <p className="text-sm text-gray-600 mb-4">
              Manage your subscription, payment methods, and billing history via Stripe's secure
              portal.
            </p>

            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{error}</div>}

            <button onClick={handleManageBilling} className="btn-primary" disabled={loading}>
              {loading ? 'Loading...' : 'Manage Billing'}
            </button>
          </div>

          <div className="card">
            <h3 className="font-semibold text-lg mb-4">Plan Details</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Plan:</span>{' '}
                <span className="font-medium">Premium ($299/month)</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Concierge storage with pickup and delivery as needed
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
