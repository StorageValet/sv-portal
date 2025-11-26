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
      active: { color: 'text-green-400 bg-green-900/30 border-green-700/50', text: 'Active' },
      trialing: { color: 'text-blue-400 bg-blue-900/30 border-blue-700/50', text: 'Trial Period' },
      past_due: { color: 'text-red-400 bg-red-900/30 border-red-700/50', text: 'Past Due' },
      unpaid: { color: 'text-red-400 bg-red-900/30 border-red-700/50', text: 'Unpaid' },
      incomplete: { color: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50', text: 'Setup Incomplete' },
      incomplete_expired: { color: 'text-orange-400 bg-orange-900/30 border-orange-700/50', text: 'Setup Expired' },
      paused: { color: 'text-bone bg-slate border-slate', text: 'Paused' },
      canceled: { color: 'text-bone bg-slate border-slate', text: 'Canceled' },
      inactive: { color: 'text-bone bg-slate border-slate', text: 'Inactive' },
    }
    return statusMap[status] || statusMap.inactive
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-cream">Your Account</h1>
          <p className="mt-1 text-sm text-bone">
            Update your profile, delivery information, and manage your subscription.
          </p>
        </div>

        <ProfileEditForm />

        <div className="bg-gunmetal-2 p-6 rounded-lg shadow border border-slate">
          <h3 className="text-lg font-medium leading-6 text-cream">Subscription & Billing</h3>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm text-bone">
                  Current Plan: <span className="font-semibold text-cream">Storage Valet Premium ($299/month)</span>
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-bone">Status:</span>
                  <span className={`text-sm font-semibold px-2 py-1 rounded border ${getStatusDisplay(profile?.subscription_status || 'inactive').color}`}>
                    {getStatusDisplay(profile?.subscription_status || 'inactive').text}
                  </span>
                </div>
                {profile?.last_payment_at && (
                  <p className="text-xs text-bone/70">
                    Last payment: {format(new Date(profile.last_payment_at), 'MMM d, yyyy')}
                  </p>
                )}
                {profile?.subscription_status === 'past_due' && profile?.last_payment_failed_at && (
                  <div className="mt-2 p-3 bg-red-900/30 border border-red-700/50 rounded-md">
                    <p className="text-sm text-red-400 font-medium">⚠️ Payment Issue</p>
                    <p className="text-xs text-red-300 mt-1">
                      Last payment failed on {format(new Date(profile.last_payment_failed_at), 'MMM d, yyyy')}.
                      Please update your payment method to continue service.
                    </p>
                  </div>
                )}
                {['incomplete', 'incomplete_expired'].includes(profile?.subscription_status || '') && (
                  <div className="mt-2 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-md">
                    <p className="text-sm text-yellow-400 font-medium">⚠️ Setup Required</p>
                    <p className="text-xs text-yellow-300 mt-1">
                      Your subscription setup is incomplete. Please finish checkout to activate your account.
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={handleManageBilling}
                className="inline-flex justify-center rounded-md border border-transparent bg-bone py-2 px-4 text-sm font-medium text-gunmetal shadow-sm hover:bg-cream"
              >
                Manage Billing
              </button>
            </div>
          </div>
          <p className="mt-4 text-xs text-bone/70">
            You will be redirected to our secure payment partner, Stripe, to manage your subscription.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
