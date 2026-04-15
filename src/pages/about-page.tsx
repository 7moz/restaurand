import { ArrowRight, ChefHat, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { ROUTES } from '../constants/routes'
import { useLanguage } from '../context/language-context'

export function AboutPage() {
  const { t } = useLanguage()

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl bg-[#24211b] text-[#f2ebdc]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_30%,rgba(228,195,100,0.2),transparent_32%),linear-gradient(130deg,#24211b_0%,#1c1a15_70%)]" />
        <div className="relative z-10 px-6 py-16 sm:px-10 lg:px-14 lg:py-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#e3c87b]">
            <ChefHat className="size-3.5" /> {t('about.established')}
          </div>
          <h1 className="mt-5 text-4xl leading-[0.95] sm:text-5xl lg:text-7xl">
            {t('about.heroTitlePrefix')} <span className="italic text-[#d9b44f]">{t('about.heroTitleHighlight')}</span> {t('about.heroTitleSuffix')}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[#ece4d2]/80 sm:text-base">
            {t('about.heroDescription')}
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-2xl bg-[#efede6] p-3 shadow-[0_10px_24px_rgba(0,0,0,0.07)] sm:p-4">
          <div className="h-[280px] rounded-xl bg-[linear-gradient(145deg,#1f1d18,#4b463a)] sm:h-[360px]" />
        </div>
        <div className="self-center space-y-4">
          <h2 className="text-3xl sm:text-4xl">{t('about.culinarySoul')}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t('about.philosophy')}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t('about.partnerships')}
          </p>
          <Button asChild>
            <Link to={ROUTES.appDashboard}>
              {t('about.exploreSources')}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl sm:text-4xl">{t('about.visionaries')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t('about.visionariesDescription')}</p>
          </div>
          <span className="text-3xl text-[#d2c6aa] sm:text-5xl">{t('about.maitreD')}</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-border/40 bg-[#f6f4ed]">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 text-xl">
                <Users className="size-5 text-primary" /> {t('about.promiseCardOneTitle')}
              </CardTitle>
              <CardDescription>{t('about.chefTitle')}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t('about.chefBio')}
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-[#f6f4ed]">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 text-xl">
                <Sparkles className="size-5 text-primary" /> {t('about.promiseCardTwoTitle')}
              </CardTitle>
              <CardDescription>{t('about.sommelierTitle')}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t('about.sommelierBio')}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="rounded-3xl bg-[#efeee9] p-6 sm:p-10">
        <h2 className="text-center text-3xl sm:text-4xl">{t('about.heritage')}</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            { year: t('about.stepOne'), title: t('about.foundationTitle'), text: t('about.foundationText') },
            { year: t('about.stepTwo'), title: t('about.expansionTitle'), text: t('about.expansionText') },
            { year: t('about.evolutionYear'), title: t('about.evolutionTitle'), text: t('about.evolutionText') },
          ].map((milestone) => (
            <article key={milestone.year} className="rounded-2xl bg-card p-5 text-center">
              <p className="text-2xl italic text-primary">{milestone.year}</p>
              <h3 className="mt-3 text-xl">{milestone.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{milestone.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="editorial-glass rounded-3xl bg-[#171915] px-6 py-10 text-center text-[#f2ebdc] shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
        <h3 className="text-3xl sm:text-4xl">{t('about.ctaTitle')}</h3>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-[#e9e0cb]/80 sm:text-base">
          {t('about.ctaDescription')}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to={ROUTES.contact}>{t('about.bookTable')}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to={ROUTES.appDashboard}>{t('about.viewMenu')}</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
