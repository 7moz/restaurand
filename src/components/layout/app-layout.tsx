import { Outlet } from 'react-router-dom'
import { Header } from './header'
import { MobileNav } from './mobile-nav'
import { NavbarAdmin } from './navbar-admin'

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <NavbarAdmin />
      <MobileNav />
      <Header />
      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
