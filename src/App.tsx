import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/common/protected-route'
import { AppLayout } from './components/layout/app-layout'
import { PublicLayout } from './components/layout/public-layout'
import { Spinner } from './components/ui/spinner'
import { ROUTES } from './constants/routes'

const PublicDashboardPage = lazy(() => import('./pages/public-dashboard-page').then((m) => ({ default: m.PublicDashboardPage })))
const MenuPage = lazy(() => import('./pages/menu-page').then((m) => ({ default: m.MenuPage })))
const AboutPage = lazy(() => import('./pages/about-page').then((m) => ({ default: m.AboutPage })))
const ContactPage = lazy(() => import('./pages/contact-page').then((m) => ({ default: m.ContactPage })))
const LoginPage = lazy(() => import('./pages/login-page').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('./pages/register-page').then((m) => ({ default: m.RegisterPage })))
const ShopPage = lazy(() => import('./pages/shop-page').then((m) => ({ default: m.ShopPage })))
const CheckoutPage = lazy(() => import('./pages/checkout-page').then((m) => ({ default: m.CheckoutPage })))
const OrderConfirmationPage = lazy(() => import('./pages/order-confirmation-page').then((m) => ({ default: m.OrderConfirmationPage })))
const OrderTrackingPage = lazy(() => import('./pages/order-tracking-page').then((m) => ({ default: m.OrderTrackingPage })))
const UserOrderHistoryPage = lazy(() => import('./pages/user-order-history-page').then((m) => ({ default: m.UserOrderHistoryPage })))
const UserDashboardPage = lazy(() => import('./pages/user-dashboard-page').then((m) => ({ default: m.UserDashboardPage })))
const AdminDashboardPage = lazy(() => import('./pages/admin-dashboard-page').then((m) => ({ default: m.AdminDashboardPage })))
const AdminOrdersPage = lazy(() => import('./pages/admin-orders-page').then((m) => ({ default: m.AdminOrdersPage })))
const AdminReclamationsPage = lazy(() => import('./pages/admin-reclamations-page').then((m) => ({ default: m.AdminReclamationsPage })))
const MenuManagementPage = lazy(() => import('./pages/menu-management-page').then((m) => ({ default: m.MenuManagementPage })))
const CategoryManagementPage = lazy(() => import('./pages/category-management-page').then((m) => ({ default: m.CategoryManagementPage })))
const StatisticsPage = lazy(() => import('./pages/statistics-page').then((m) => ({ default: m.StatisticsPage })))
const UserProfilePage = lazy(() => import('./pages/user-profile-page').then((m) => ({ default: m.UserProfilePage })))

function App() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner className="size-8 text-primary" />
        </div>
      }
    >
      <Routes>
        <Route path={ROUTES.root} element={<Navigate to={ROUTES.appDashboard} replace />} />
        <Route path={ROUTES.legacyDashboard} element={<Navigate to={ROUTES.appDashboard} replace />} />

        <Route element={<PublicLayout />}>
          <Route path={ROUTES.appDashboard} element={<PublicDashboardPage />} />
          <Route path={ROUTES.menu} element={<MenuPage />} />
          <Route path={ROUTES.about} element={<AboutPage />} />
          <Route path={ROUTES.contact} element={<ContactPage />} />
        </Route>

        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.register} element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<PublicLayout />}>
            <Route path={ROUTES.shop} element={<ShopPage />} />
            <Route path={ROUTES.orderHistory} element={<UserOrderHistoryPage />} />
            <Route path={ROUTES.checkout} element={<CheckoutPage />} />
            <Route path={ROUTES.orderConfirmation} element={<OrderConfirmationPage />} />
            <Route path={`${ROUTES.orderTracking}/:orderId`} element={<OrderTrackingPage />} />
            <Route path={ROUTES.profile} element={<UserProfilePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path={ROUTES.userDashboard} element={<UserDashboardPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route element={<AppLayout />}>
            <Route path={ROUTES.adminDashboard} element={<AdminDashboardPage />} />
            <Route path={ROUTES.adminOrders} element={<AdminOrdersPage />} />
            <Route path={ROUTES.reclamations} element={<AdminReclamationsPage />} />
            <Route path={ROUTES.menus} element={<MenuManagementPage />} />
            <Route path={ROUTES.statistics} element={<StatisticsPage />} />
            <Route path={ROUTES.categories} element={<CategoryManagementPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.appDashboard} replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
