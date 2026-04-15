import { useState } from 'react'
import { BarChart3, LogOut, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth-context'
import { useLanguage } from '../../context/language-context'
import { ROUTES } from '../../constants/routes'
import { Button } from '../ui/button'

interface AdminProfileDropdownProps {
  onAction?: () => void
}

export function AdminProfileDropdown({ onAction }: AdminProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const { role, logout } = useAuth()
  const { t } = useLanguage()

  if (role !== 'ADMIN') {
    return null
  }

  const closeMenu = () => setIsOpen(false)

  const handleStatistics = () => {
    closeMenu()
    onAction?.()
    navigate(ROUTES.statistics)
  }

  const handleLogout = async () => {
    closeMenu()
    onAction?.()
    await logout()
  }

  return (
    <div className="relative z-[60]">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Admin actions"
      >
        <User className="size-5" />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeMenu} />
          <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border/80 bg-card/95 p-2 shadow-xl ring-1 ring-black/5 backdrop-blur supports-[backdrop-filter]:bg-card/85">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 w-full justify-start gap-2 rounded-lg px-3 text-sm"
              onClick={handleStatistics}
            >
              <BarChart3 className="size-4" />
              {t('adminNav.statistics')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 w-full justify-start gap-2 rounded-lg px-3 text-sm"
              onClick={() => void handleLogout()}
            >
              <LogOut className="size-4" />
              {t('adminNav.logout')}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}