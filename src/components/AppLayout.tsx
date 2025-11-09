import { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Schedule', to: '/schedule' },
    { label: 'Account', to: '/account' },
  ]

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-gunmetal shadow-sm border-b border-gunmetal-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="flex items-center">
              <img src="/logo.png" alt="Storage Valet" className="h-10 w-auto" />
            </Link>
            <div className="flex gap-4 items-center">
              {navItems.map(item => {
                const isActive = location.pathname === item.to
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`text-sm font-medium ${
                      isActive
                        ? 'text-bone'
                        : 'text-cream hover:text-bone transition-colors'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-cream hover:text-bone transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
