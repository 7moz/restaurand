import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/auth-context'
import { Spinner } from '../ui/spinner'

export function PublicRoute() {
  const { isAuthenticated, role, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={role === 'ADMIN' ? '/admin-dashboard' : '/user-dashboard'} replace />
  }

  return <Outlet />
}
