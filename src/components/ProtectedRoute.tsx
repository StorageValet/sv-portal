import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const initialDoneRef = { current: false }
    const unmountedRef = { current: false }

    const clearHash = () => {
      // Preserve query params (UTMs, deep links, etc.)
      window.history.replaceState(null, '', location.pathname + location.search)
    }

    // Check if URL has auth hash (magic link callback)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const hasAuthHash = hashParams.has('access_token')
    const errorDescription = hashParams.get('error_description')

    // Handle expired/invalid magic links
    if (errorDescription) {
      toast.error(errorDescription.replace(/\+/g, ' '), { duration: 5000 })
      clearHash()
    }

    const waitForSession = async (timeoutMs: number, intervalMs: number) => {
      const deadline = Date.now() + timeoutMs

      while (Date.now() < deadline) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) return true
        await new Promise(resolve => setTimeout(resolve, intervalMs))
      }

      return false
    }

    const initAuth = async () => {
      try {
        // If magic link callback, wait (bounded) for Supabase to process hash → session
        if (hasAuthHash) {
          await waitForSession(1500, 75)
        }

        const { data: { session }, error } = await supabase.auth.getSession()

        // Clear hash after processing (success or error), preserving location.search
        if (hasAuthHash) {
          clearHash()
        }

        if (error) {
          toast.error('Session expired. Please sign in again.', { duration: 4000 })
        }

        if (!unmountedRef.current) {
          setAuthenticated(!!session)
          setLoading(false)
          initialDoneRef.current = true
        }
      } catch (e) {
        // Fail closed: end loading and require login
        if (!unmountedRef.current) {
          setAuthenticated(false)
          setLoading(false)
          initialDoneRef.current = true
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Do not let listener compete with initial boot
      if (!initialDoneRef.current || unmountedRef.current) return

      if (event === 'SIGNED_OUT') {
        toast('You have been signed out.', { icon: '👋' })
      }

      setAuthenticated(!!session)
      // IMPORTANT: do NOT setLoading(false) here
    })

    return () => {
      unmountedRef.current = true
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sv-slate">Loading...</div>
      </div>
    )
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
