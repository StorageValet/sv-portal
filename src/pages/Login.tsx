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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Hero Panel - Desktop: Left Side, Mobile: Top Header */}
      <div className="bg-sv-deep-teal flex items-center justify-center p-8 lg:p-12 lg:w-1/2">
        <img
          src="/logo-auth-hero.png"
          alt="Storage Valet"
          className="w-48 sm:w-64 lg:w-full lg:max-w-lg mx-auto"
        />
      </div>

      {/* Form Panel - Right Side / Below on Mobile */}
      <div className="flex-1 flex items-center justify-center bg-sv-parchment p-8">
        <div className="max-w-md w-full space-y-8">

          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-semibold text-sv-gunmetal">Sign in to your account</h1>
            <p className="mt-2 text-sv-slate">Enter your email to receive a magic link</p>
          </div>

          {sent ? (
            <div className="card text-center">
              <h2 className="text-xl font-semibold text-sv-gunmetal mb-2">Check your email</h2>
              <p className="text-sv-slate">
                We sent a magic link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-sv-slate mt-4">
                Click the link in the email to sign in. It may take up to 2 minutes to arrive.
              </p>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="card">
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-sv-gunmetal mb-1">
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

          <p className="text-center text-xs text-sv-slate">
            Premium concierge storage — available as needed
          </p>
        </div>
      </div>
    </div>
  )
}
