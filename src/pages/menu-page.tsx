import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Grid3X3, List, Plus, Search } from 'lucide-react'
import { foodApi, menuApi, resolveBackendUrl } from '../api'
import { useAuth } from '../context/auth-context'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardTitle } from '../components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Spinner } from '../components/ui/spinner'
import { ROUTES } from '../constants/routes'
import { useCart } from '../context/cart-context'
import { LoginPromptModal } from '../components/common/login-prompt-modal'
import type { FoodItem } from '../types/dashboard'
import { useLanguage } from '../context/language-context'

const PENDING_FOOD_STORAGE_KEY = 'resto_pending_food_item'

export function MenuPage() {
  const navigate = useNavigate()
  const { token, isAuthenticated } = useAuth()
  const { addItem } = useCart()
  const { t } = useLanguage()
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [pendingFood, setPendingFood] = useState<FoodItem | null>(null)

  const menusQuery = useQuery({
    queryKey: ['public-menus'],
    queryFn: async () => (await menuApi.getAllMenus(token)).data,
  })

  const foodsQuery = useQuery({
    queryKey: ['public-foods'],
    queryFn: async () => (await foodApi.getAllFoods(token)).data,
  })

  const menus = menusQuery.data ?? []
  const foods = useMemo(
    () => (foodsQuery.data ?? []).filter((food) => food.enabled !== false),
    [foodsQuery.data],
  )

  const visibleFoods = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return foods.filter((food) => {
      const matchesMenu = selectedMenuId ? food.menuId === selectedMenuId : true
      if (!matchesMenu) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return `${food.name} ${food.description ?? ''}`.toLowerCase().includes(normalizedSearch)
    })
  }, [foods, selectedMenuId, searchTerm])

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
    <div className="space-y-6">
      <section className="space-y-2 rounded-3xl bg-[#f3f1ea] p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl">{t('dashboard.seasonalArchiveTitle')}</h1>
        <p className="text-sm text-muted-foreground sm:text-base">{t('dashboard.seasonalArchiveDescription')}</p>
      </section>

      <section className="sticky top-16 z-40 -mx-4 border-y border-border/50 bg-background/95 px-4 py-3 shadow-sm backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:top-20 lg:px-8">
        <div className="flex flex-col gap-3">
          <div className="no-scrollbar flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
            <Button
              type="button"
              size="sm"
              variant={selectedMenuId === null ? 'default' : 'secondary'}
              onClick={() => setSelectedMenuId(null)}
            >
              {t('dashboard.all')}
            </Button>
            {menus.map((menu) => (
              <Button
                key={menu.id}
                type="button"
                size="sm"
                variant={selectedMenuId === menu.id ? 'default' : 'secondary'}
                onClick={() => setSelectedMenuId(menu.id)}
              >
                {menu.name}
              </Button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-9 w-full rounded-full border border-border/60 bg-background pl-9 pr-4 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50"
                placeholder={t('dashboard.searchDishes')}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="inline-flex self-start rounded-lg border border-border/60 bg-secondary p-1 sm:self-auto">
              <button
                type="button"
                className={`rounded-md p-1.5 transition ${viewMode === 'grid' ? 'bg-card text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                aria-label={t('dashboard.gridView')}
                aria-pressed={viewMode === 'grid'}
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="size-4" />
              </button>
              <button
                type="button"
                className={`rounded-md p-1.5 transition ${viewMode === 'list' ? 'bg-card text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                aria-label={t('dashboard.listView')}
                aria-pressed={viewMode === 'list'}
                onClick={() => setViewMode('list')}
              >
                <List className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-card/80 p-4 sm:p-6 lg:p-8 editorial-surface">
        {menusQuery.isLoading || foodsQuery.isLoading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : menusQuery.isError || foodsQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>{t('dashboard.unableLoadMenuData')}</AlertTitle>
            <AlertDescription>
              {menusQuery.error instanceof Error
                ? menusQuery.error.message
                : foodsQuery.error instanceof Error
                  ? foodsQuery.error.message
                  : t('dashboard.unexpectedLoadMenuData')}
            </AlertDescription>
          </Alert>
        ) : (
          <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4' : 'space-y-3'}>
            {visibleFoods.map((food) => {
              const menuName = menus.find((menu) => menu.id === food.menuId)?.name ?? t('dashboard.foodFallbackMenuName')
              return (
                <Card
                  key={food.id}
                  className={`overflow-hidden border-border/30 bg-[#f7f5ee] transition ${
                    viewMode === 'grid'
                      ? 'flex h-[330px] flex-col hover:-translate-y-1 hover:shadow-xl'
                      : 'flex flex-col sm:h-[200px] sm:flex-row'
                  }`}
                >
                  <div className={`relative shrink-0 overflow-hidden bg-muted/40 ${viewMode === 'grid' ? 'h-44' : 'h-40 sm:h-full sm:w-64'}`}>
                    {food.imageUrl ? (
                      <img
                        src={resolveBackendUrl(food.imageUrl) ?? undefined}
                        alt={food.name}
                        className={`h-full w-full ${viewMode === 'grid' ? 'object-cover object-top' : 'object-cover object-center'}`}
                      />
                    ) : (
                      <div className="h-full bg-gradient-to-br from-amber-200/75 via-orange-200/55 to-yellow-100/80" />
                    )}
                    <Button
                      type="button"
                      size="icon"
                      className="absolute right-3 top-3 h-9 w-9"
                      onClick={() => handleAddFood(food)}
                      aria-label={t('dashboard.addToShop', { name: food.name })}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <CardContent className="flex flex-1 flex-col justify-between gap-2 p-4">
                    <div className="space-y-1">
                      <div className="inline-flex w-fit items-center rounded-full bg-secondary px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-secondary-foreground">
                        {menuName}
                      </div>
                      <CardTitle className="line-clamp-1 text-lg leading-snug">{food.name}</CardTitle>
                      {food.description ? (
                        <p className={`text-xs leading-snug text-muted-foreground ${viewMode === 'grid' ? 'line-clamp-2' : 'line-clamp-3'}`}>
                          {food.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="inline-flex rounded-lg bg-primary/10 px-2 py-1 text-sm font-bold text-primary">
                      €{Number(food.price).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
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