import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

type ServiceType = 'pickup' | 'redelivery' | 'container_delivery'

export default function Schedule() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Assumes item IDs are passed in state from the Dashboard link
  const { selectedItemIds = [] } = location.state || { selectedItemIds: [] }

  // Determine initial tab based on passed items, if any
  const getInitialTab = (): ServiceType => {
    if (location.state?.action === 'redelivery') return 'redelivery'
    if (location.state?.action === 'pickup') return 'pickup'
    return 'pickup'
  }
  const [activeTab, setActiveTab] = useState<ServiceType>(getInitialTab())

  const scheduleMutation = useMutation({
    mutationFn: async (newAction: {
      service_type: ServiceType
      item_ids?: string[]
      details: Record<string, any>
      scheduled_at: string
    }) => {
      setIsSubmitting(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not found')

      const { error } = await supabase.from('actions').insert({
        user_id: user.id,
        service_type: newAction.service_type,
        item_ids: newAction.item_ids,
        details: newAction.details,
        scheduled_at: newAction.scheduled_at,
        status: 'pending',
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] })
      alert('Request scheduled successfully!')
      navigate('/dashboard')
    },
    onError: (error) => {
      alert(`Error: ${error.message}`)
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const scheduled_at = formData.get('datetime') as string

    // Minimum 48 hours notice
    const minDate = new Date()
    minDate.setHours(minDate.getHours() + 48)
    if (new Date(scheduled_at) < minDate) {
      alert('Please schedule at least 48 hours in advance.')
      return
    }

    let details = { notes: formData.get('notes') as string }
    if (activeTab === 'container_delivery') {
      details = {
        ...details,
        bins: num(formData.get('bins') as string),
        totes: num(formData.get('totes') as string),
        crates: num(formData.get('crates') as string),
      }
    }

    scheduleMutation.mutate({
      service_type: activeTab,
      item_ids: selectedItemIds,
      details,
      scheduled_at,
    })
  }

  const num = (val: string) => Number(val) || 0

  const renderContent = () => {
    switch (activeTab) {
      case 'pickup':
      case 'redelivery':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {selectedItemIds.length > 0
                  ? `${selectedItemIds.length} Item(s) Selected`
                  : 'No Items Selected'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {selectedItemIds.length > 0
                  ? `You are scheduling a ${activeTab} for the selected items.`
                  : `Please select items from your dashboard to schedule a ${activeTab}.`}
              </p>
            </div>
            <div>
              <label htmlFor="datetime" className="block text-sm font-medium text-gray-700">
                Requested Date & Time *
              </label>
              <input
                type="datetime-local"
                name="datetime"
                id="datetime"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
              <p className="mt-1 text-xs text-gray-500">Minimum 48 hours notice required.</p>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Special Instructions
              </label>
              <textarea
                name="notes"
                id="notes"
                rows={4}
                placeholder="Any special instructions for our team..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
            </div>
          </div>
        )
      case 'container_delivery':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Request Empty Containers</h3>
              <p className="text-sm text-gray-500 mb-4">
                We'll deliver empty containers for you to pack before your first pickup.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="bins" className="block text-sm font-medium text-gray-700">
                  Bins
                </label>
                <input
                  type="number"
                  name="bins"
                  id="bins"
                  defaultValue="0"
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>
              <div>
                <label htmlFor="totes" className="block text-sm font-medium text-gray-700">
                  Totes
                </label>
                <input
                  type="number"
                  name="totes"
                  id="totes"
                  defaultValue="0"
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>
              <div>
                <label htmlFor="crates" className="block text-sm font-medium text-gray-700">
                  Crates
                </label>
                <input
                  type="number"
                  name="crates"
                  id="crates"
                  defaultValue="0"
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>
            </div>
            <div>
              <label htmlFor="datetime" className="block text-sm font-medium text-gray-700">
                Requested Delivery Date & Time *
              </label>
              <input
                type="datetime-local"
                name="datetime"
                id="datetime"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
              <p className="mt-1 text-xs text-gray-500">Minimum 48 hours notice required.</p>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Special Instructions
              </label>
              <textarea
                name="notes"
                id="notes"
                rows={3}
                placeholder="Delivery preferences, access instructions, etc..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const getTabClass = (tabName: ServiceType) =>
    `px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      activeTab === tabName
        ? 'bg-indigo-600 text-white'
        : 'text-gray-600 hover:bg-gray-100'
    }`

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Schedule a Service</h1>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('pickup')}
            className={getTabClass('pickup')}
            type="button"
          >
            Pickup
          </button>
          <button
            onClick={() => setActiveTab('redelivery')}
            className={getTabClass('redelivery')}
            type="button"
          >
            Redelivery
          </button>
          <button
            onClick={() => setActiveTab('container_delivery')}
            className={getTabClass('container_delivery')}
            type="button"
          >
            Request Containers
          </button>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {renderContent()}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-md bg-white py-2 px-4 text-sm font-medium text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  )
}
