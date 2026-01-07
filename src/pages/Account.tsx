import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import AppLayout from '../components/AppLayout'
import { supabase } from '../lib/supabase'
import ProfileEditForm from '../components/ProfileEditForm'

export default function Account() {
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data, error } = await supabase.from('customer_profile').select('*').eq('user_id', user.id).single()
      if (error) {
        console.warn('Could not fetch profile:', error.message)
        return null
      }
      return data
    },
  })

  const handleManageBilling = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session')
      if (error) throw error
      window.location.href = data.url
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      active: { color: 'text-green-700 bg-green-50 border-green-200', text: 'Active' },
      trialing: { color: 'text-sv-navy bg-sv-bone border-sv-sand', text: 'Trial Period' },
      past_due: { color: 'text-red-700 bg-red-50 border-red-200', text: 'Past Due' },
      unpaid: { color: 'text-red-700 bg-red-50 border-red-200', text: 'Unpaid' },
      incomplete: { color: 'text-yellow-700 bg-yellow-50 border-yellow-200', text: 'Setup Incomplete' },
      incomplete_expired: { color: 'text-orange-700 bg-orange-50 border-orange-200', text: 'Setup Expired' },
      paused: { color: 'text-sv-slate bg-sv-ivory border-sv-sand', text: 'Paused' },
      canceled: { color: 'text-sv-slate bg-sv-ivory border-sv-sand', text: 'Canceled' },
      inactive: { color: 'text-sv-slate bg-sv-ivory border-sv-sand', text: 'Inactive' },
    }
    return statusMap[status] || statusMap.inactive
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-sv-midnight">Your Account</h1>
          <p className="mt-1 text-sm text-sv-slate">
            Update your profile, delivery information, and manage your subscription.
          </p>
        </div>

        <ProfileEditForm />

        <div className="card">
          <h3 className="text-lg font-semibold text-sv-midnight">Subscription & Billing</h3>
          <div className="mt-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm text-sv-slate">
                  Current Plan: <span className="font-semibold text-sv-midnight">Storage Valet Premium ($299/month)</span>
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-sv-slate">Status:</span>
                  <span className={`text-sm font-semibold px-2 py-1 rounded border ${getStatusDisplay(profile?.subscription_status || 'inactive').color}`}>
                    {getStatusDisplay(profile?.subscription_status || 'inactive').text}
                  </span>
                </div>
                {/* v4.0: Trial end date */}
                {profile?.subscription_status === 'trialing' && profile?.trial_end_at && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700 font-medium">Free Trial Active</p>
                    <p className="text-xs text-green-600 mt-1">
                      Your trial ends on {format(new Date(profile.trial_end_at), 'MMM d, yyyy')}.
                      Billing begins automatically after the trial period.
                    </p>
                  </div>
                )}
                {/* v4.0: Cancel at period end notice */}
                {profile?.cancel_at_period_end && profile?.cancel_at && (
                  <div className="mt-2 p-3 bg-sv-bone border border-sv-sand rounded-md">
                    <p className="text-sm text-sv-midnight font-medium">Cancellation Scheduled</p>
                    <p className="text-xs text-sv-slate mt-1">
                      Your subscription will cancel on {format(new Date(profile.cancel_at), 'MMM d, yyyy')}.
                      You'll retain access until then. No further charges will occur.
                    </p>
                  </div>
                )}
                {profile?.last_payment_at && (
                  <p className="text-xs text-sv-stone">
                    Last payment: {format(new Date(profile.last_payment_at), 'MMM d, yyyy')}
                  </p>
                )}
                {profile?.subscription_status === 'past_due' && profile?.last_payment_failed_at && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700 font-medium">Payment Issue</p>
                    <p className="text-xs text-red-600 mt-1">
                      Last payment failed on {format(new Date(profile.last_payment_failed_at), 'MMM d, yyyy')}.
                      Please update your payment method to continue service.
                    </p>
                  </div>
                )}
                {['incomplete', 'incomplete_expired'].includes(profile?.subscription_status || '') && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-700 font-medium">Setup Required</p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Your subscription setup is incomplete. Please finish checkout to activate your account.
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={handleManageBilling}
                className="btn-primary whitespace-nowrap"
              >
                Manage Billing
              </button>
            </div>
          </div>
          <p className="mt-4 text-xs text-sv-stone">
            You will be redirected to our secure payment partner, Stripe, to manage your subscription.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
