import { ROUTES } from '../constants/routes'

type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

const loadedRoutes = new Set<string>()

const loaders: Record<string, () => Promise<unknown>> = {
  [ROUTES.appDashboard]: () => import('../pages/public-dashboard-page'),
  [ROUTES.about]: () => import('../pages/about-page'),
  [ROUTES.contact]: () => import('../pages/contact-page'),
  [ROUTES.login]: () => import('../pages/login-page'),
  [ROUTES.register]: () => import('../pages/register-page'),
  [ROUTES.shop]: () => import('../pages/shop-page'),
  [ROUTES.orderHistory]: () => import('../pages/user-order-history-page'),
  [ROUTES.checkout]: () => import('../pages/checkout-page'),
  [ROUTES.orderConfirmation]: () => import('../pages/order-confirmation-page'),
  [ROUTES.userDashboard]: () => import('../pages/user-dashboard-page'),
  [ROUTES.adminDashboard]: () => import('../pages/admin-dashboard-page'),
  [ROUTES.adminOrders]: () => import('../pages/admin-orders-page'),
  [ROUTES.reclamations]: () => import('../pages/admin-reclamations-page'),
  [ROUTES.menus]: () => import('../pages/menu-management-page'),
  [ROUTES.categories]: () => import('../pages/category-management-page'),
  [ROUTES.statistics]: () => import('../pages/statistics-page'),
}

export function prefetchRoute(route: AppRoute | string) {
  const normalizedRoute = route.startsWith(ROUTES.orderTracking) ? ROUTES.orderTracking : route
  const loader =
    normalizedRoute === ROUTES.orderTracking
      ? () => import('../pages/order-tracking-page')
      : loaders[normalizedRoute]

  if (!loader || loadedRoutes.has(normalizedRoute)) {
    return
  }

  loadedRoutes.add(normalizedRoute)
  void loader().catch(() => {
    loadedRoutes.delete(normalizedRoute)
  })
}

export function prefetchRoutes(routes: ReadonlyArray<AppRoute | string>) {
  routes.forEach((route) => prefetchRoute(route))
}