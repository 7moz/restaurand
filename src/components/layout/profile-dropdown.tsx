import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '../../context/auth-context'
import { ROUTES } from '../../constants/routes'
import { Button } from '../ui/button'
import { useLanguage } from '../../context/language-context'

export function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { t } = useLanguage()

  if (!user) return null

  const handleViewProfile = () => {
    setIsOpen(false)
    navigate(ROUTES.profile)
  }

  const handleLogout = async () => {
    setIsOpen(false)
    await logout()
    navigate(ROUTES.appDashboard, { replace: true })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-2 transition-colors hover:bg-secondary"
        title={user.email}
      >
        <User className="size-5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
            <div className="border-b border-border px-4 py-3">
              <p className="w-full truncate text-sm font-medium text-foreground" title={user.email}>
                {user.email}
              </p>
            </div>
            <div className="flex flex-col gap-1 p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={handleViewProfile}
              >
                <User className="size-4" />
                {t('nav.viewProfile')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                {t('nav.logout')}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
