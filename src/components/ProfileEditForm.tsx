import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useState } from 'react';

// Validation helpers
function validatePhone(phone: string): string | null {
  if (!phone) return null; // Optional field
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  // US phone: 10 digits (or 11 if starts with 1)
  if (digits.length === 10) return null;
  if (digits.length === 11 && digits.startsWith('1')) return null;
  return 'Phone must be a valid 10-digit US number';
}

function validateZip(zip: string): string | null {
  if (!zip) return 'ZIP code is required';
  // US ZIP: 5 digits or 5+4 format
  const zipRegex = /^\d{5}(-\d{4})?$/;
  if (!zipRegex.test(zip)) {
    return 'ZIP must be 5 digits (e.g., 07030) or 5+4 format (e.g., 07030-1234)';
  }
  return null;
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

export default function ProfileEditForm() {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      // Use maybeSingle() instead of single() to handle new users with no profile yet
      const { data, error } = await supabase.from('customer_profile').select('*').eq('user_id', user.id).maybeSingle();
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

      // Get current user ID from auth session (works for both new and existing users)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Use upsert to handle both new users (insert) and existing users (update)
      const { error } = await supabase
        .from('customer_profile')
        .upsert(
          { ...updatedProfile, user_id: user.id },
          { onConflict: 'user_id' }
        );

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const phone = formData.get('phone') as string;
    const zip = formData.get('zip') as string;

    // Validate
    const newErrors: Record<string, string> = {};
    const phoneError = validatePhone(phone);
    const zipError = validateZip(zip);

    if (phoneError) newErrors.phone = phoneError;
    if (zipError) newErrors.zip = zipError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the validation errors');
      return;
    }

    setErrors({});

    const updatedProfile = {
      full_name: formData.get('full_name') as string,
      phone: phone ? formatPhone(phone) : '',
      delivery_address: {
        street: formData.get('street') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        zip: zip,
        unit: formData.get('unit') as string,
      },
      delivery_instructions: formData.get('delivery_instructions') as string,
    };

    updateProfileMutation.mutate(updatedProfile);
  };

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-6 bg-bone rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          <div className="h-10 bg-bone rounded"></div>
          <div className="h-10 bg-bone rounded"></div>
          <div className="h-20 bg-bone rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gunmetal">Personal Information</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gunmetal/80 mb-1">Full Name</label>
          <input type="text" name="full_name" id="full_name" defaultValue={profile?.full_name || ''} className="input w-full" />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gunmetal/80 mb-1">Phone Number</label>
          <input
            type="tel"
            name="phone"
            id="phone"
            defaultValue={profile?.phone || ''}
            placeholder="(201) 555-1234"
            className={`input w-full ${errors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
          />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gunmetal">Delivery Address</h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="street" className="block text-sm font-medium text-gunmetal/80 mb-1">Street Address</label>
            <input type="text" name="street" id="street" defaultValue={profile?.delivery_address?.street || ''} className="input w-full" />
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gunmetal/80 mb-1">City</label>
            <input type="text" name="city" id="city" defaultValue={profile?.delivery_address?.city || ''} className="input w-full" />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gunmetal/80 mb-1">State</label>
            <input type="text" name="state" id="state" defaultValue={profile?.delivery_address?.state || ''} placeholder="NJ" className="input w-full" />
          </div>
          <div>
            <label htmlFor="zip" className="block text-sm font-medium text-gunmetal/80 mb-1">ZIP Code *</label>
            <input
              type="text"
              name="zip"
              id="zip"
              defaultValue={profile?.delivery_address?.zip || ''}
              placeholder="07030"
              className={`input w-full ${errors.zip ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.zip && <p className="mt-1 text-xs text-red-600">{errors.zip}</p>}
          </div>
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gunmetal/80 mb-1">Apt / Unit (Optional)</label>
            <input type="text" name="unit" id="unit" defaultValue={profile?.delivery_address?.unit || ''} className="input w-full" />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="delivery_instructions" className="block text-sm font-medium text-gunmetal/80 mb-1">Delivery Instructions</label>
        <textarea name="delivery_instructions" id="delivery_instructions" rows={3} defaultValue={profile?.delivery_instructions || ''} className="input w-full"></textarea>
        <p className="mt-1 text-xs text-gunmetal/60">e.g., "Use the back door, gate code is #1234."</p>
      </div>

      <div className="flex justify-end items-center pt-4 border-t border-slate/20">
        <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-50">
          {isSubmitting ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}
