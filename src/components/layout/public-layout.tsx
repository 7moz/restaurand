import { Outlet } from 'react-router-dom'
import { PublicNavbar } from './public-navbar'
import { SiteFooter } from './site-footer'

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-transparent">
      <PublicNavbar />
      <main className="editorial-container w-full py-6 sm:py-8 lg:py-10">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
