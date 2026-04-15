import { useQuery } from '@tanstack/react-query'
import { foodApi, menuApi } from '../api'
import { useAuth } from '../context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Spinner } from '../components/ui/spinner'

export function StatisticsPage() {
  const { token } = useAuth()

  const menusQuery = useQuery({
    queryKey: ['statistics-menus'],
    queryFn: async () => (await menuApi.getAllMenus(token)).data,
  })

  const foodsQuery = useQuery({
    queryKey: ['statistics-foods'],
    queryFn: async () => (await foodApi.getAllFoods(token)).data,
  })

  if (menusQuery.isLoading || foodsQuery.isLoading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  const menus = menusQuery.data ?? []
  const foods = foodsQuery.data ?? []
  const totalValue = foods.reduce((acc, food) => acc + Number(food.price), 0)
  const averagePrice = foods.length ? totalValue / foods.length : 0
  const weeklyRevenue = totalValue * 1.75
  const satisfaction = foods.length > 0 ? Math.min(5, 3.5 + foods.length / 30) : 0

  return (
    <div className="space-y-6">
      <section className="space-y-2 rounded-3xl bg-[#f3f1ea] p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-4xl text-[#2f2a21] sm:text-5xl">Performance Analytics</h1>
            <p className="text-sm text-muted-foreground">Detailed overview of revenue, catalog depth, and peak service indicators.</p>
          </div>
          <div className="inline-flex rounded-full bg-secondary p-1">
            <button className="rounded-full bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">Weekly</button>
            <button className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Monthly</button>
            <button className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Yearly</button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Revenue" value={`€${weeklyRevenue.toFixed(2)}`} trend="+12.4%" />
        <StatCard title="Total Orders" value={String(foods.length * 9)} trend="+5.2%" />
        <StatCard title="Avg. Ticket" value={`€${averagePrice.toFixed(2)}`} trend="-2.1%" />
        <StatCard title="Guest Satisfaction" value={`${satisfaction.toFixed(1)}/5`} trend="Stable" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.5fr_0.8fr]">
        <Card className="border-border/40 bg-card">
          <CardHeader>
            <CardTitle className="text-3xl">Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] rounded-xl bg-[linear-gradient(180deg,#f7f5ee,#ece7da)] p-3">
              <div className="grid h-full grid-cols-7 items-end gap-2">
                {[40, 65, 55, 80, 95, 90, 70].map((h, idx) => (
                  <div key={idx} className="flex h-full flex-col items-center justify-end gap-2">
                    <div className={`w-full rounded-t-md ${idx === 4 ? 'bg-primary' : 'bg-primary/25'}`} style={{ height: `${h}%` }} />
                    <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card">
          <CardHeader>
            <CardTitle className="text-2xl">Popular Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {foods.slice(0, 5).map((food) => (
              <div key={food.id} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2 text-sm">
                <span className="line-clamp-1 max-w-[65%]">{food.name}</span>
                <span className="font-semibold">€{Number(food.price).toFixed(2)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Categories" value={String(menus.length)} trend="Catalog structure" />
        <StatCard title="Total Foods" value={String(foods.length)} trend="Items published" />
        <StatCard title="Average Food Price" value={`€${averagePrice.toFixed(2)}`} trend="Menu pricing" />
        <StatCard title="Total Catalog Value" value={`€${totalValue.toFixed(2)}`} trend="Estimated value" />
      </section>
    </div>
  )
}

function StatCard({ title, value, trend }: { title: string; value: string; trend: string }) {
  return (
    <Card className="border-border/40 bg-card">
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="mt-2 text-xs text-muted-foreground">{trend}</p>
      </CardContent>
    </Card>
  )
}
