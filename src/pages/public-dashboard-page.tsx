import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Star } from 'lucide-react'
import { foodApi, resolveBackendUrl } from '../api'
import { useAuth } from '../context/auth-context'
import { Button } from '../components/ui/button'
import { ROUTES } from '../constants/routes'
import { useCart } from '../context/cart-context'
import { LoginPromptModal } from '../components/common/login-prompt-modal'
import type { FoodItem } from '../types/dashboard'
import { prefetchRoute } from '../lib/route-prefetch'
import heroImage from '../assets/backback.avif'
import { useLanguage } from '../context/language-context'

const PENDING_FOOD_STORAGE_KEY = 'resto_pending_food_item'

export function PublicDashboardPage() {
  const navigate = useNavigate()
  const { token, isAuthenticated } = useAuth()
  const { addItem } = useCart()
  const { t } = useLanguage()
  const [pendingFood, setPendingFood] = useState<FoodItem | null>(null)

  const foodsQuery = useQuery({
    queryKey: ['public-foods'],
    queryFn: async () => (await foodApi.getAllFoods(token)).data,
  })

  const foods = useMemo(
    () => (foodsQuery.data ?? []).filter((food) => food.enabled !== false),
    [foodsQuery.data],
  )
  const featuredFood = useMemo(() => {
    if (foods.length === 0) {
      return null
    }

    return [...foods].sort((a, b) => Number(b.price) - Number(a.price))[0]
  }, [foods])

  const handleAddFood = (food: FoodItem) => {
    if (isAuthenticated) {
      addItem(food)
      return
    }

    setPendingFood(food)
  }

  const handleLoginFromPrompt = () => {
    if (!pendingFood) {
      return
    }

    window.localStorage.setItem(PENDING_FOOD_STORAGE_KEY, JSON.stringify(pendingFood))
    setPendingFood(null)
    navigate(ROUTES.login, { state: { from: ROUTES.shop } })
  }

  return (
    <div className="space-y-10 lg:space-y-14">
      <section className="relative overflow-hidden rounded-3xl bg-[#23201a] text-[#f4efe2]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1f1d18]/90 via-[#29241b]/65 to-transparent" />
        <img
          src={heroImage}
          alt="Chef plating a modern dish"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="relative z-10 px-5 py-14 sm:px-10 sm:py-20 lg:max-w-2xl lg:px-14">
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[#ddc47f]">{t('dashboard.heroEyebrow')}</p>
          <h1 className="text-4xl leading-[0.95] sm:text-5xl lg:text-7xl">
            {t('dashboard.heroTitlePrefix')} <span className="italic text-[#d6b349]">{t('dashboard.heroTitleHighlight')}</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm text-[#ebe6d8]/80 sm:text-base">
            {t('dashboard.heroDescription')}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link
                to={ROUTES.menu}
                onMouseEnter={() => prefetchRoute(ROUTES.menu)}
                onFocus={() => prefetchRoute(ROUTES.menu)}
                onTouchStart={() => prefetchRoute(ROUTES.menu)}
              >
                {t('dashboard.orderNow')}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <a
                href="https://deliveroo.fr/en/menu/Paris/19eme-jaures/fresh-food-paris-19?day=today&geohash=u09wn7uqtvpr&time=ASAP"
                target="_blank"
                rel="noreferrer"
              >
                {t('dashboard.ourStory')}
              </a>
            </Button>
          </div>
        </div>
      </section>

      {featuredFood ? (
        <section className="grid gap-6 rounded-3xl bg-[#efeee9] p-4 sm:p-8 lg:grid-cols-[1.1fr_1fr]">
          <div className="overflow-hidden rounded-2xl bg-[#171612]">
            {featuredFood.imageUrl ? (
              <img
                src={resolveBackendUrl(featuredFood.imageUrl) ?? undefined}
                alt={featuredFood.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-[260px] bg-gradient-to-br from-[#2c2920] to-[#171612]" />
            )}
          </div>
          <div className="space-y-4 self-center">
            <p className="text-xs uppercase tracking-[0.18em] text-primary">{t('dashboard.featuredEyebrow')}</p>
            <h3 className="text-3xl sm:text-4xl">{t('dashboard.specialOfMonth')}</h3>
            <p className="text-sm text-muted-foreground sm:text-base">
              {featuredFood.description || t('dashboard.featuredDescriptionFallback')}
            </p>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
              <Star className="size-4 fill-current text-primary" />
              {t('dashboard.complexityFiveNotes')}
            </div>
            <Button type="button" onClick={() => handleAddFood(featuredFood)}>
              {t('dashboard.reserveDish')} - €{Number(featuredFood.price).toFixed(2)}
            </Button>
          </div>
        </section>
      ) : null}

      <section className="space-y-6 pb-4">
        <h3 className="text-center text-3xl sm:text-4xl">{t('dashboard.culinaryExperiences')}</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: t('dashboard.chefTableTitle'),
              description: t('dashboard.chefTableDescription'),
            },
            {
              title: t('dashboard.sommelierPairingTitle'),
              description: t('dashboard.sommelierPairingDescription'),
            },
            {
              title: t('dashboard.privateAtelierTitle'),
              description: t('dashboard.privateAtelierDescription'),
            },
          ].map((experience) => (
            <article key={experience.title} className="rounded-2xl bg-[#f1efe9] p-6">
              <h4 className="text-xl">{experience.title}</h4>
              <p className="mt-3 text-sm text-muted-foreground">{experience.description}</p>
            </article>
          ))}
        </div>
      </section>

      <LoginPromptModal
        open={!!pendingFood && !isAuthenticated}
        title={t('dashboard.loginRequiredTitle')}
        description={pendingFood ? t('dashboard.loginRequiredDescription', { name: pendingFood.name }) : t('dashboard.signInToContinue')}
        onLogin={handleLoginFromPrompt}
        onClose={() => setPendingFood(null)}
      />
    </div>
  )
}
