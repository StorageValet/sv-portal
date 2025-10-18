import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useState } from 'react';

export default function ProfileEditForm() {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.from('customer_profile').select('*').eq('user_id', user.id).single();
      if (error) throw new Error(error.message);
      return data;
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedProfile: {
      full_name?: string;
      phone?: string;
      delivery_address?: object;
      delivery_instructions?: string;
    }) => {
      setIsSubmitting(true);
      if (!profile) throw new Error("Profile not found");

      const { error } = await supabase
        .from('customer_profile')
        .update(updatedProfile)
        .eq('user_id', profile.user_id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const updatedProfile = {
      full_name: formData.get('full_name') as string,
      phone: formData.get('phone') as string,
      delivery_address: {
        street: formData.get('street') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        zip: formData.get('zip') as string,
        unit: formData.get('unit') as string,
      },
      delivery_instructions: formData.get('delivery_instructions') as string,
    };

    updateProfileMutation.mutate(updatedProfile);
  };

  if (isLoading) {
    return (
        <div className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-6">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
            </div>
        </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Personal Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" name="full_name" id="full_name" defaultValue={profile?.full_name || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input type="tel" name="phone" id="phone" defaultValue={profile?.phone || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
        </div>

        <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Delivery Address</h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label htmlFor="street" className="block text-sm font-medium">Street Address</label>
                    <input type="text" name="street" id="street" defaultValue={profile?.delivery_address?.street || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                <div>
                    <label htmlFor="city" className="block text-sm font-medium">City</label>
                    <input type="text" name="city" id="city" defaultValue={profile?.delivery_address?.city || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                 <div>
                    <label htmlFor="state" className="block text-sm font-medium">State</label>
                    <input type="text" name="state" id="state" defaultValue={profile?.delivery_address?.state || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                <div>
                    <label htmlFor="zip" className="block text-sm font-medium">ZIP Code</label>
                    <input type="text" name="zip" id="zip" defaultValue={profile?.delivery_address?.zip || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                 <div>
                    <label htmlFor="unit" className="block text-sm font-medium">Apt / Unit (Optional)</label>
                    <input type="text" name="unit" id="unit" defaultValue={profile?.delivery_address?.unit || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
            </div>
        </div>

        <div>
            <label htmlFor="delivery_instructions" className="block text-sm font-medium text-gray-700">Delivery Instructions</label>
            <textarea name="delivery_instructions" id="delivery_instructions" rows={3} defaultValue={profile?.delivery_instructions || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"></textarea>
            <p className="mt-2 text-xs text-gray-500">e.g., "Use the back door, gate code is #1234."</p>
        </div>

        <div className="flex justify-end items-center pt-4 border-t">
            {successMessage && <p className="text-sm text-green-600 mr-4 transition-opacity duration-300">{successMessage}</p>}
            <button type="submit" disabled={isSubmitting} className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50">
                {isSubmitting ? 'Saving...' : 'Save Profile'}
            </button>
        </div>
    </form>
  );
}
