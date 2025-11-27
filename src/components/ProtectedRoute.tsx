import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const location = useLocation()

  useEffect(() => {
    // Check if URL has auth hash (magic link callback)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const hasAuthHash = hashParams.has('access_token')
    const errorDescription = hashParams.get('error_description')

    // Handle expired/invalid magic links
    if (errorDescription) {
      toast.error(errorDescription.replace(/\+/g, ' '), { duration: 5000 })
      // Clear the hash to prevent repeated toasts
      window.history.replaceState(null, '', location.pathname)
    }

    const initAuth = async () => {
      // If magic link callback, wait for Supabase to process hash
      if (hasAuthHash) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const { data: { session }, error } = await supabase.auth.getSession()

      // Handle session errors (expired tokens, etc.)
      if (error) {
        toast.error('Session expired. Please sign in again.', { duration: 4000 })
      }

      setAuthenticated(!!session)
      setLoading(false)
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Handle auth state changes
      if (event === 'TOKEN_REFRESHED') {
        // Token was refreshed successfully
      } else if (event === 'SIGNED_OUT') {
        toast('You have been signed out.', { icon: '👋' })
      }

      setAuthenticated(!!session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [location.pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
