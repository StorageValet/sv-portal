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
    { label: 'Account', to: '/account' },
  ]

  return (
    <div className="min-h-screen bg-honeydew">
      <nav className="bg-stormy-teal shadow-sm border-b border-oxford-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="flex items-center">
              <img src="/logo-wordmark-navy.png" alt="Storage Valet" className="h-8 w-auto md:h-8 sm:h-7" />
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
                        ? 'text-white'
                        : 'text-frosted-blue hover:text-white transition-colors'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-frosted-blue hover:text-white transition-colors"
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
