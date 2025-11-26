import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import ItemSelectionModal from '../components/ItemSelectionModal'

export default function Schedule() {
  const location = useLocation()
  const navigate = useNavigate()

  // Check for action_id query parameter (item selection mode)
  const searchParams = new URLSearchParams(location.search)
  const actionId = searchParams.get('action_id')

  // If no action_id, redirect to dashboard where booking flow starts
  useEffect(() => {
    if (!actionId) {
      navigate('/dashboard', { replace: true })
    }
  }, [actionId, navigate])

  // If action_id is present, render item selection mode
  if (actionId) {
    return (
      <AppLayout>
        <ItemSelectionModal actionId={actionId} />
      </AppLayout>
    )
  }

  // Loading state while redirecting
  return (
    <AppLayout>
      <div className="p-8 text-center">
        <p className="text-bone/70">Redirecting to dashboard...</p>
      </div>
    </AppLayout>
  )
}
