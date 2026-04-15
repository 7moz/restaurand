import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { ROUTES } from '../constants/routes'
import { useAuth } from '../context/auth-context'
import { useCart } from '../context/cart-context'
import { useLanguage } from '../context/language-context'
import type { FoodItem } from '../types/dashboard'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loginWithGoogle } = useAuth()
  const { addItem } = useCart()
  const { t } = useLanguage()
  const pendingFoodStorageKey = 'resto_pending_food_item'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const welcomeName = useMemo(() => (email ? email.split('@')[0] : 'Chef'), [email])

  const handleSuccessfulAuthentication = async (authenticatedUser: { role: string }) => {
    if (authenticatedUser.role === 'ADMIN') {
      navigate(ROUTES.adminDashboard, { replace: true })
      return
    }

    const hasPendingItem = typeof window !== 'undefined' && window.localStorage.getItem(pendingFoodStorageKey)
    if (hasPendingItem) {
      const storedPendingItem = window.localStorage.getItem(pendingFoodStorageKey)
      if (storedPendingItem) {
        const parsedPendingItem = JSON.parse(storedPendingItem) as FoodItem
        addItem(parsedPendingItem)
        window.localStorage.removeItem(pendingFoodStorageKey)
      }

      navigate(ROUTES.shop, { replace: true })
      return
    }

    const redirectPath = (location.state as { from?: string } | undefined)?.from ?? ROUTES.appDashboard
    navigate(redirectPath, { replace: true })
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setGoogleLoading(true)

    try {
      const authenticatedUser = await loginWithGoogle()
      await handleSuccessfulAuthentication(authenticatedUser)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.googleSignInFailed'))
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const authenticatedUser = await login(email, password)
      await handleSuccessfulAuthentication(authenticatedUser)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative grid min-h-[calc(100vh-12rem)] place-items-center overflow-hidden bg-[#f9f7f0] py-8">
      <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-[#8f7a3c]/10 blur-3xl" />

      <section className="relative z-10 w-full max-w-md rounded-2xl border border-border/40 bg-card px-6 py-7 shadow-[0_14px_36px_rgba(0,0,0,0.12)] sm:px-8 sm:py-9">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Fresh Food</p>
          <h1 className="mt-3 font-serif text-4xl text-[#2f2a21]">{t('auth.welcomeBack')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('auth.signInToContinue', { name: welcomeName })}</p>
        </div>

        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>{t('auth.authError')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t('auth.emailAddress')}</label>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@culinary-editorial.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t('auth.password')}</label>
              <span className="text-xs text-primary">{t('auth.forgotPassword')}</span>
            </div>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="h-12 w-full text-base" disabled={loading}>
            {loading ? t('auth.signingIn') : t('auth.signIn')}
            {!loading ? <ArrowRight className="size-4" /> : null}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t('auth.continueWith')}</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? t('auth.connectingGoogle') : t('auth.continueWithGoogle')}
          </Button>
        </div>

        <p className="mt-7 text-center text-sm text-muted-foreground">
          {t('auth.dontHaveAccount')}{' '}
          <Link to={ROUTES.register} className="font-semibold text-primary hover:underline">
            {t('auth.signUp')}
          </Link>
        </p>
      </section>
    </div>
  )
}
