import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { ROUTES } from '../constants/routes'
import { useAuth } from '../context/auth-context'
import { useLanguage } from '../context/language-context'

export function UserProfilePage() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { t } = useLanguage()

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">{t('profile.pleaseSignIn')}</p>
          <Button onClick={() => navigate(ROUTES.login)}>{t('nav.signIn')}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[#f9f7f0] py-12">
      <div className="editorial-container mx-auto max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-6 gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
          {t('profile.back')}
        </Button>

        <section className="rounded-2xl border border-border/40 bg-card px-8 py-9 shadow-lg">
          <h1 className="mb-8 font-serif text-3xl text-[#2f2a21]">{t('profile.yourProfile')}</h1>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/20 text-2xl font-semibold text-primary">
                {(user.fullName?.charAt(0) ?? user.email.charAt(0)).toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('profile.fullName')}</p>
                <p className="text-lg font-medium text-foreground">{user.fullName || t('profile.notProvided')}</p>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <p className="text-sm text-muted-foreground">{t('profile.email')}</p>
              <p className="mt-1 text-lg font-medium text-foreground">{user.email}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
