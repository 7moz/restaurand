import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ChefHat, ClipboardList, ShieldCheck, Sparkles } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { useAuth } from '../context/auth-context'
import { ROUTES } from '../constants/routes'
import { useLanguage } from '../context/language-context'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { t } = useLanguage()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (!acceptedTerms) {
      setError(t('register.acceptTermsError'))
      return
    }
    setLoading(true)

    try {
      await register(fullName, email, phone, password)
      setSuccess(t('register.registrationSuccess'))
      setTimeout(() => navigate(ROUTES.login), 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('register.registrationFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-12rem)] place-items-center py-6">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-border/40 bg-card shadow-[0_18px_40px_rgba(0,0,0,0.12)] lg:grid-cols-2">
        <section className="relative hidden min-h-[640px] overflow-hidden lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(228,195,100,0.32),transparent_34%),linear-gradient(150deg,#24211b_0%,#1a1915_70%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between p-10 text-[#f1ead8]">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
              <ChefHat className="size-3.5" /> RestoOS
            </div>
            <div>
              <h2 className="mt-6 text-5xl leading-[0.95]">{t('register.heroTitle')}</h2>
              <p className="mt-4 text-sm leading-relaxed text-[#ece5d4]/85">{t('register.heroDescription')}</p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 rounded-xl bg-white/10 p-3">
                <ClipboardList className="size-4" /> {t('register.featureOne')}
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/10 p-3">
                <ShieldCheck className="size-4" /> {t('register.featureTwo')}
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/10 p-3">
                <Sparkles className="size-4" /> {t('register.featureThree')}
              </div>
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-10">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-4xl">{t('register.createAccount')}</CardTitle>
            <CardDescription className="text-base">{t('register.beginJourney')}</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {error ? (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>{t('register.registrationError')}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {success ? (
              <Alert variant="success" className="mb-4">
                <AlertTitle>{t('register.success')}</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t('register.fullName')}</label>
                <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Julianne Smith" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t('auth.emailAddress')}</label>
                <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="j.smith@editorial.com" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t('register.phone')}</label>
                  <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+1 (555) 000-0000" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t('register.password')}</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={6}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <div className="rounded-xl bg-secondary/60 px-3 py-2 text-xs italic text-muted-foreground">
                {t('register.passwordHint')}
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  className="mt-0.5 size-4 accent-primary"
                />
                <span>{t('register.acceptTerms')}</span>
              </label>
              <div className="border-t border-border/70 pt-4">
                <Button type="submit" className="h-12 w-full text-base" disabled={loading}>
                  {loading ? t('register.creating') : t('register.registerMembership')}
                  {!loading ? <ArrowRight className="size-4" /> : null}
                </Button>
              </div>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              {t('register.alreadyHaveAccount')}{' '}
              <Link to={ROUTES.login} className="font-semibold text-primary hover:underline">
                {t('register.signIn')}
              </Link>
            </p>
          </CardContent>
        </section>
      </div>
    </div>
  )
}
