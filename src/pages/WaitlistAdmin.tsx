import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import AppLayout from '../components/AppLayout'

export default function WaitlistAdmin() {
  const { data: isAdmin } = useQuery({
    queryKey: ['is-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('fn_is_admin')
      if (error) throw error
      return data || false
    },
  })

  const { data: waitlistData, isLoading } = useQuery({
    queryKey: ['waitlist-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('fn_waitlist_analytics')
      if (error) throw error
      return data || []
    },
    enabled: !!isAdmin,
  })

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

  const totalSignups = waitlistData?.reduce((acc: number, row: any) => acc + Number(row.signup_count), 0) || 0
  const totalRefunds = waitlistData?.reduce((acc: number, row: any) => acc + Number(row.needs_refund_count), 0) || 0

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Waitlist Analytics</h1>
          <p className="text-gray-600">Expansion planning data for out-of-service-area signups</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Waitlist</h3>
            <p className="text-3xl font-bold text-gunmetal">{totalSignups}</p>
            <p className="text-sm text-gray-600 mt-1">customers waiting</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Unique ZIP Codes</h3>
            <p className="text-3xl font-bold text-gunmetal">{waitlistData?.length || 0}</p>
            <p className="text-sm text-gray-600 mt-1">expansion targets</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Refunds</h3>
            <p className="text-3xl font-bold text-red-600">{totalRefunds}</p>
            <p className="text-sm text-gray-600 mt-1">need processing</p>
          </div>
        </div>

        {/* Waitlist Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Demand by ZIP Code</h2>
          </div>

          {isLoading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : waitlistData && waitlistData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ZIP Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      City
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Signups
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Refunds Needed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      First Signup
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Latest Signup
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {waitlistData.map((row: any, index: number) => (
                    <tr key={row.zip_code} className={index === 0 ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                        {index === 0 && <span className="ml-2 text-yellow-600">🏆</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.zip_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.cities?.join(', ') || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gunmetal">
                          {row.signup_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {row.needs_refund_count > 0 ? (
                          <span className="text-sm text-red-600 font-medium">
                            {row.needs_refund_count}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(row.earliest_signup).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(row.latest_signup).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No waitlist signups yet
            </div>
          )}
        </div>

        {/* Expansion Recommendations */}
        {waitlistData && waitlistData.length > 0 && (
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Expansion Recommendations</h3>
            <div className="space-y-2 text-sm text-blue-800">
              {waitlistData.slice(0, 3).map((row: any, index: number) => (
                <p key={row.zip_code}>
                  <span className="font-semibold">Priority {index + 1}:</span> ZIP {row.zip_code} ({row.cities?.join(', ') || 'Unknown'})
                  - {row.signup_count} potential customers
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
