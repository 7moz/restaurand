import { useQuery } from '@tanstack/react-query'
import { Activity, BarChart3, CircleGauge, ListChecks } from 'lucide-react'
import type { ElementType } from 'react'
import { foodApi, menuApi } from '../api'
import { useAuth } from '../context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Spinner } from '../components/ui/spinner'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { useLanguage } from '../context/language-context'

export function AdminDashboardPage() {
  const { token } = useAuth()
  const { t } = useLanguage()

  const menusQuery = useQuery({
    queryKey: ['admin-menus'],
    queryFn: async () => (await menuApi.getAllMenus(token)).data,
  })

  const foodsQuery = useQuery({
    queryKey: ['admin-foods'],
    queryFn: async () => (await foodApi.getAllFoods(token)).data,
  })

  if (menusQuery.isLoading || foodsQuery.isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (menusQuery.isError || foodsQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('adminDashboard.failedToLoad')}</AlertTitle>
        <AlertDescription>
          {(menusQuery.error as Error | undefined)?.message || (foodsQuery.error as Error | undefined)?.message}
        </AlertDescription>
      </Alert>
    )
  }

  const menus = menusQuery.data ?? []
  const foods = foodsQuery.data ?? []
  const averagePrice = foods.length ? foods.reduce((acc, item) => acc + Number(item.price), 0) / foods.length : 0

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-[#f3f1ea] p-6 sm:p-8">
        <div className="space-y-2">
          <div className="space-y-2">
            <h1 className="font-serif text-4xl text-[#2f2a21] sm:text-5xl">{t('adminDashboard.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('adminDashboard.subtitle')}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ListChecks} label={t('adminDashboard.categories')} value={menus.length.toString()} note={t('adminDashboard.menuSectionsLive')} trend="+4" />
        <MetricCard icon={BarChart3} label={t('adminDashboard.totalFoods')} value={foods.length.toString()} note={t('adminDashboard.publishedItems')} trend="+11" />
        <MetricCard icon={CircleGauge} label={t('adminDashboard.averagePrice')} value={`€${averagePrice.toFixed(2)}`} note={t('adminDashboard.catalogBaseline')} trend="Stable" />
        <MetricCard icon={Activity} label={t('adminDashboard.adminMode')} value="ON" note={t('adminDashboard.realtimeControlsActive')} trend="Live" highlighted />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
        <Card className="border-border/40 bg-card">
          <CardHeader>
            <CardTitle className="text-3xl">{t('adminDashboard.catalogSnapshot')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {foods.slice(0, 6).map((food) => (
              <div key={food.id} className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-3 text-sm">
                <span className="line-clamp-1 max-w-[70%]">{food.name}</span>
                <span className="font-semibold">€{Number(food.price).toFixed(2)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-[#171915] text-[#f2ebdc]">
          <CardHeader>
            <CardTitle className="text-2xl text-[#f2ebdc]">{t('adminDashboard.kitchenFlow')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-[#e6dcc3]">
            <p className="rounded-xl bg-white/10 px-3 py-2">{t('adminDashboard.stationA')}</p>
            <p className="rounded-xl bg-white/10 px-3 py-2">{t('adminDashboard.stationB')}</p>
            <p className="rounded-xl bg-white/10 px-3 py-2">{t('adminDashboard.stationC')}</p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  trend,
  highlighted = false,
}: {
  icon: ElementType
  label: string
  value: string
  note: string
  trend: string
  highlighted?: boolean
}) {
  return (
    <Card className={`border-border/40 ${highlighted ? 'bg-[#7a6408] text-[#f4efde]' : 'bg-card'}`}>
      <CardHeader>
        <CardTitle className={`flex items-center justify-between gap-2 text-sm ${highlighted ? 'text-[#efe3bf]' : 'text-muted-foreground'}`}>
          <span className="inline-flex items-center gap-2"><Icon className="size-4" /> {label}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${highlighted ? 'bg-white/15 text-[#f6efde]' : 'bg-primary/10 text-primary'}`}>
            {trend}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${highlighted ? 'text-[#f8f3e3]' : 'text-foreground'}`}>{value}</p>
        <p className={`mt-2 text-xs ${highlighted ? 'text-[#e6d7ab]' : 'text-muted-foreground'}`}>{note}</p>
      </CardContent>
    </Card>
  )
}
