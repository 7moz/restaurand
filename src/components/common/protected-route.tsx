import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '../ui/spinner'
import { useAuth } from '../../context/auth-context'
import type { UserRole } from '../../types/auth'
import { ROUTES } from '../../constants/routes'

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const location = useLocation()
  const { isAuthenticated, role, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={ROUTES.login} replace state={{ from }} />
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to={ROUTES.appDashboard} replace />
  }

  return <Outlet />
}
