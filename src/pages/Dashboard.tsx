import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ItemCard from '../components/ItemCard'

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: items, isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
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
              <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Your Items</h2>
          {profile && (
            <p className="text-gray-600">
              Subscription: <span className="font-medium capitalize">{profile.subscription_status}</span>
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="text-gray-600">Loading your items...</div>
        ) : items && items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <ItemCard key={item.id} {...item} />
            ))}
          </div>
        ) : (
          <div className="card text-center">
            <p className="text-gray-600 mb-4">No items yet. Schedule a pickup to get started.</p>
            <Link to="/schedule" className="btn-primary">
              Schedule Pickup
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
