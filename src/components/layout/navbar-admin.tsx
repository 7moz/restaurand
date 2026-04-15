import { Link, useLocation } from 'react-router-dom'
import { ClipboardList, LayoutDashboard, LogOut, MailWarning, MenuSquare, Store } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../context/auth-context'
import type { UserRole } from '../../types/auth'
import type { ElementType } from 'react'
import { ROUTES } from '../../constants/routes'
import { useLanguage } from '../../context/language-context'
import { LanguageSelector } from './language-selector'
import { AdminProfileDropdown } from './admin-profile-dropdown'
import freshfoodLogo from '../../assets/freshfood.svg'

export function NavbarAdmin() {
  const { pathname } = useLocation()
  const { role, logout } = useAuth()
  const { t } = useLanguage()

  const links: Array<{ labelKey: string; to: string; icon: ElementType; roles: UserRole[] }> = [
    {
      labelKey: 'adminNav.dashboard',
      to: role === 'ADMIN' ? ROUTES.adminDashboard : ROUTES.userDashboard,
      icon: LayoutDashboard,
      roles: ['USER', 'ADMIN'],
    },
    { labelKey: 'adminNav.orders', to: ROUTES.adminOrders, icon: ClipboardList, roles: ['ADMIN'] },
    { labelKey: 'adminNav.reclamations', to: ROUTES.reclamations, icon: MailWarning, roles: ['ADMIN'] },
    { labelKey: 'adminNav.category', to: ROUTES.categories, icon: Store, roles: ['ADMIN'] },
    { labelKey: 'adminNav.menus', to: ROUTES.menus, icon: MenuSquare, roles: ['ADMIN'] },
  ]

  return (
    <nav className="sticky top-0 z-50 hidden h-20 border-b border-sidebar-border bg-sidebar/95 px-6 backdrop-blur lg:flex lg:items-center lg:justify-between">
      <div className="flex items-center gap-6 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <img src={freshfoodLogo} alt="FreshFood Logo" className="h-[80px] w-auto" />
        </div>

        <ul className="flex min-w-0 items-center gap-1 overflow-x-auto">
          {links
            .filter((link) => (role ? link.roles.includes(role) : false))
            .map((link) => {
              const isActive = pathname === link.to
              return (
                <li key={link.to} className="shrink-0">
                  <Link
                    to={link.to}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-primary ring-1 ring-sidebar-ring/35'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                    )}
                  >
                    <link.icon className="size-4" />
                    {t(link.labelKey)}
                  </Link>
                </li>
              )
            })}
        </ul>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <LanguageSelector />
        {role === 'ADMIN' ? (
          <AdminProfileDropdown />
        ) : (
          <button
            onClick={() => logout()}
            className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-destructive/10 hover:text-red-200"
          >
            <LogOut className="size-4" />
            {t('adminNav.logout')}
          </button>
        )}
      </div>
    </nav>
  )
}