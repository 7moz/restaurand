import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, LogOut, MailWarning, Menu, MenuSquare, Store, X, ClipboardList } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import { useAuth } from '../../context/auth-context'
import { api } from '../../api'
import type { UserRole } from '../../types/auth'
import type { ElementType } from 'react'
import { useLanguage } from '../../context/language-context'
import { LanguageSelector } from './language-selector'
import { AdminProfileDropdown } from './admin-profile-dropdown'
import { ROUTES } from '../../constants/routes'
import freshfoodLogo from '../../assets/freshfood.svg'

interface Category {
  id: number
  name: string
}

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const { pathname } = useLocation()
  const { role, logout } = useAuth()
  const { t } = useLanguage()

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/api/menus')
      return response.data || []
    },
    enabled: role === 'USER',
  })

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
    <div className="lg:hidden">
      <div className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-sidebar/95 px-4 backdrop-blur">
        <div className="flex items-center gap-2 text-sidebar-foreground">
          <img src={freshfoodLogo} alt="FreshFood Logo" className="h-[80px] w-auto" />
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen((prev) => !prev)}>
          {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {role === 'USER' && categories.length > 0 ? (
        <div className="border-b border-border bg-card/80 px-3 py-2">
          <div
            className="flex items-start gap-3 overflow-x-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {categories.map((category: Category) => (
              <div key={category.id} className="flex w-18 flex-shrink-0 flex-col items-center gap-1 rounded-md px-1 py-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-semibold">
                  {category.name.charAt(0).toUpperCase()}
                </div>
                <span className="line-clamp-2 text-center text-[11px] font-medium text-foreground">{category.name}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-x-0 bottom-0 top-14 z-40 overflow-y-auto overscroll-contain bg-background px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="mb-4 flex items-center justify-end gap-2">
            <LanguageSelector />
            {role === 'ADMIN' ? <AdminProfileDropdown onAction={() => setIsOpen(false)} /> : null}
          </div>
          <ul className="space-y-2">
            {links
              .filter((link) => (role ? link.roles.includes(role) : false))
              .map((link) => {
                const isActive = pathname === link.to
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium',
                        isActive ? 'bg-sidebar-accent text-sidebar-primary' : 'text-muted-foreground',
                      )}
                    >
                      <link.icon className="size-5" />
                      {t(link.labelKey)}
                    </Link>
                  </li>
                )
              })}
          </ul>
          {role !== 'ADMIN' ? (
            <button
              onClick={() => {
                setIsOpen(false)
                void logout()
              }}
              className="mt-6 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="size-5" />
              {t('adminNav.logout')}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
