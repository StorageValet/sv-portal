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
    <div className="min-h-screen flex items-center justify-center bg-honeydew">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <img src="/logo.png" alt="Storage Valet" className="h-32 w-auto mx-auto mb-6" />
          <p className="mt-2 text-oxford-navy">Sign in to your account</p>
        </div>

        {sent ? (
          <div className="card text-center">
            <h2 className="text-xl font-semibold text-text-primary mb-2">Check your email</h2>
            <p className="text-text-secondary">
              We sent a magic link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-text-secondary mt-4">
              Click the link in the email to sign in. It may take up to 2 minutes to arrive.
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="card">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">
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
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>
              )}

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send magic link'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-xs text-text-secondary">
          Premium concierge storage — available as needed
        </p>
      </div>
    </div>
  )
}
