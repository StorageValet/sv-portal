import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import AppLayout from '../components/AppLayout'
import toast from 'react-hot-toast'

interface CreateCustomerForm {
  email: string
  first_name: string
  last_name: string
  phone: string
  street: string
  unit: string
  city: string
  state: string
  zip: string
  skip_payment: boolean
}

const initialFormState: CreateCustomerForm = {
  email: '',
  first_name: '',
  last_name: '',
  phone: '',
  street: '',
  unit: '',
  city: '',
  state: 'NJ',
  zip: '',
  skip_payment: false,
}

export default function AdminCustomers() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CreateCustomerForm>(initialFormState)

  // Check if user is admin
  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ['is-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('fn_is_admin')
      if (error) throw error
      return data || false
    },
  })

  // Create customer mutation
  const createCustomer = useMutation({
    mutationFn: async (formData: CreateCustomerForm) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-customer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email: formData.email,
            first_name: formData.first_name || undefined,
            last_name: formData.last_name || undefined,
            phone: formData.phone || undefined,
            address: formData.street ? {
              street: formData.street,
              unit: formData.unit,
              city: formData.city,
              state: formData.state,
              zip: formData.zip,
            } : undefined,
            skip_payment: formData.skip_payment,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create customer')
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast.success(`Customer created: ${data.email}`)
      setForm(initialFormState)
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email) {
      toast.error('Email is required')
      return
    }
    createCustomer.mutate(form)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  if (adminLoading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-gray-500">Loading...</div>
        </div>
      </AppLayout>
    )
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">This page is restricted to administrators.</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create Customer Account</h1>
          <p className="text-gray-600">Manually create a customer account for existing customers</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          {/* Email (required) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-navy focus:ring-navy"
              placeholder="customer@example.com"
            />
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-navy focus:ring-navy"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-navy focus:ring-navy"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-navy focus:ring-navy"
              placeholder="(201) 555-1234"
            />
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Address (Optional)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label htmlFor="street" className="block text-sm text-gray-500">
                  Street
                </label>
                <input
                  type="text"
                  id="street"
                  name="street"
                  value={form.street}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-navy focus:ring-navy"
                  placeholder="123 Main St"
                />
              </div>
              <div>
                <label htmlFor="unit" className="block text-sm text-gray-500">
                  Unit
                </label>
                <input
                  type="text"
                  id="unit"
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-navy focus:ring-navy"
                  placeholder="Apt 4B"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm text-gray-500">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-navy focus:ring-navy"
                  placeholder="Hoboken"
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm text-gray-500">
                  State
                </label>
                <select
                  id="state"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-navy focus:ring-navy"
                >
                  <option value="NJ">NJ</option>
                  <option value="NY">NY</option>
                </select>
              </div>
              <div>
                <label htmlFor="zip" className="block text-sm text-gray-500">
                  ZIP
                </label>
                <input
                  type="text"
                  id="zip"
                  name="zip"
                  value={form.zip}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-navy focus:ring-navy"
                  placeholder="07030"
                  maxLength={5}
                />
              </div>
            </div>
          </div>

          {/* Skip Payment Checkbox */}
          <div className="flex items-center p-4 bg-amber-50 rounded-lg border border-amber-200">
            <input
              type="checkbox"
              id="skip_payment"
              name="skip_payment"
              checked={form.skip_payment}
              onChange={handleChange}
              className="h-4 w-4 text-navy focus:ring-navy border-gray-300 rounded"
            />
            <label htmlFor="skip_payment" className="ml-3">
              <span className="block text-sm font-medium text-gray-900">
                Bypass Payment (Set Active Immediately)
              </span>
              <span className="block text-sm text-gray-500">
                Use for existing customers or beta testers. They will not need to pay through Stripe.
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createCustomer.isPending}
              className="px-6 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createCustomer.isPending ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </form>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">After Creating:</h3>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Customer will receive a magic link email to set up their account</li>
            <li>They can then log in at portal.mystoragevalet.com</li>
            <li>If "Bypass Payment" was checked, they have immediate access</li>
            <li>Otherwise, they'll need to complete Stripe checkout before full access</li>
          </ol>
        </div>
      </div>
    </AppLayout>
  )
}
