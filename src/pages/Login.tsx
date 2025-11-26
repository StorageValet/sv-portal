import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gunmetal">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <img src="/logo.png" alt="Storage Valet" className="h-48 w-auto mx-auto mb-6" />
          <p className="mt-2 text-bone">Sign in to your account</p>
        </div>

        {sent ? (
          <div className="card text-center">
            <h2 className="text-xl font-semibold mb-2 text-cream">Check your email</h2>
            <p className="text-bone">
              We sent a magic link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-bone/70 mt-4">
              Click the link in the email to sign in. It may take up to 2 minutes to arrive.
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="card">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-bone mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-900/30 border border-red-700/50 p-3 rounded-lg">{error}</div>
              )}

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send magic link'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-xs text-bone/60">
          Premium concierge storage — available as needed
        </p>
      </div>
    </div>
  )
}
