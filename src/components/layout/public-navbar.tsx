import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogIn, Menu, ShoppingBag, UserCircle2, X } from 'lucide-react'
import { useAuth } from '../../context/auth-context'
import { useCart } from '../../context/cart-context'
import { cn } from '../../lib/utils'
import { ROUTES } from '../../constants/routes'
import { Button } from '../ui/button'
import { prefetchRoute, prefetchRoutes } from '../../lib/route-prefetch'
import { ProfileDropdown } from './profile-dropdown'
import { LanguageSelector } from './language-selector'
import { useLanguage } from '../../context/language-context'
import freshfoodLogo from '../../assets/freshfood.svg'

export function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useAuth()
  const { items } = useCart()
  const { t } = useLanguage()
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const links = [
    { label: t('nav.home'), to: ROUTES.appDashboard },
    { label: t('nav.menu'), to: ROUTES.menu },
    { label: t('nav.about'), to: ROUTES.about },
    { label: t('nav.contact'), to: ROUTES.contact },
    { label: t('nav.orders'), to: ROUTES.orderHistory },
  ]

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      prefetchRoutes([ROUTES.appDashboard, ROUTES.menu, ROUTES.shop, ROUTES.orderHistory, ROUTES.about, ROUTES.contact])
      if (!isAuthenticated) {
        prefetchRoute(ROUTES.login)
      }
    }, 350)

    return () => window.clearTimeout(timerId)
  }, [isAuthenticated])

  const createPrefetchHandlers = (route: string) => ({
    onMouseEnter: () => prefetchRoute(route),
    onFocus: () => prefetchRoute(route),
    onTouchStart: () => prefetchRoute(route),
  })

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-xl">
      <div className="editorial-container flex h-16 items-center justify-between gap-4 lg:h-20">
        <Link to={ROUTES.appDashboard} className="min-w-fit flex items-center" {...createPrefetchHandlers(ROUTES.appDashboard)}>
          <img src={freshfoodLogo} alt="FreshFood Logo" className="h-[100px] w-auto" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              {...createPrefetchHandlers(item.to)}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-4 py-2 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors',
                  isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Button asChild size="sm" className="gap-2">
            <Link to={ROUTES.shop} {...createPrefetchHandlers(ROUTES.shop)}>
              <ShoppingBag className="size-4" />
              {t('nav.cart')} {cartCount > 0 ? `(${cartCount})` : ''}
            </Link>
          </Button>
          <div className="ml-2 flex items-center gap-2 border-l border-border pl-4">
            <LanguageSelector />
            {isAuthenticated ? (
              <ProfileDropdown />
            ) : (
              <Button asChild size="sm" variant="ghost" className="gap-2">
                <Link to={ROUTES.login} {...createPrefetchHandlers(ROUTES.login)}>
                  <LogIn className="size-4" />
                  {t('nav.signIn')}
                </Link>
              </Button>
            )}
          </div>
        </nav>

        <Button type="button" variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsOpen((prev) => !prev)}>
          {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {isOpen ? (
        <div className="border-t border-border bg-background px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-2">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                {...createPrefetchHandlers(item.to)}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setIsOpen(false)
                    navigate(ROUTES.profile)
                  }}
                >
                  <UserCircle2 className="size-4" />
                  {t('nav.viewProfile')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setIsOpen(false)
                    void logout()
                    navigate(ROUTES.appDashboard, { replace: true })
                  }}
                >
                  <UserCircle2 className="size-4" />
                  {t('nav.logout')}
                </Button>
              </>
            ) : (
              <Button asChild variant="ghost" className="w-full" onClick={() => setIsOpen(false)}>
                <Link to={ROUTES.login} {...createPrefetchHandlers(ROUTES.login)}>
                  <LogIn className="size-4" />
                  {t('nav.signIn')}
                </Link>
              </Button>
            )}
            <Button asChild className="w-full" onClick={() => setIsOpen(false)}>
              <Link to={ROUTES.shop} {...createPrefetchHandlers(ROUTES.shop)}>
                <ShoppingBag className="size-4" />
                {t('nav.cart')} {cartCount > 0 ? `(${cartCount})` : ''}
              </Link>
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
