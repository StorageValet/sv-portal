import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import ProfileEditForm from '../components/ProfileEditForm';

export default function Account() {
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    // This query is reused by ProfileEditForm, so data is fetched only once.
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.from('customer_profile').select('*').eq('user_id', user.id).single();
      if (error) {
        console.warn("Could not fetch profile:", error.message);
        return null;
      }
      return data;
    }
  });

  const handleManageBilling = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session');
      if (error) throw error;
      window.location.href = data.url;
    } catch (error) {
      alert((error as Error).message);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Account</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update your profile, delivery information, and manage your subscription.
        </p>
      </div>

      {/* Profile Editing Section */}
      <ProfileEditForm />

      {/* Billing Section */}
      <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Subscription & Billing</h3>
          <div className="mt-4 flex items-center justify-between">
              <div>
                  <p className="text-sm text-gray-600">
                      Current Plan: <span className="font-semibold text-gray-800">Storage Valet Premium</span>
                  </p>
                  <p className="text-sm text-gray-600">
                      Status: <span className="font-semibold text-green-700">{profile?.subscription_status || '...'}</span>
                  </p>
              </div>
              <button
                  onClick={handleManageBilling}
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                  Manage Billing
              </button>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            You will be redirected to our secure payment partner, Stripe, to manage your subscription.
          </p>
      </div>
    </div>
  );
}
