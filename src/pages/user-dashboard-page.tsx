import { useQuery } from '@tanstack/react-query'
import { BadgeCheck, CircleDollarSign, ListChecks, Repeat2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { resolveBackendUrl, foodApi, orderApi } from '../api'
import { useAuth } from '../context/auth-context'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardTitle } from '../components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Spinner } from '../components/ui/spinner'
import { ROUTES } from '../constants/routes'
import { prefetchRoute } from '../lib/route-prefetch'

export function UserDashboardPage() {
  const { token } = useAuth()

  const foodsQuery = useQuery({
    queryKey: ['user-foods'],
    queryFn: async () => (await foodApi.getAllFoods(token)).data,
    refetchInterval: 3000,
  })

  const ordersQuery = useQuery({
    queryKey: ['user-recent-orders'],
    queryFn: async () => (await orderApi.getMyOrders(token)).data,
    retry: false,
  })

  if (foodsQuery.isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (foodsQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load foods</AlertTitle>
        <AlertDescription>{(foodsQuery.error as Error).message}</AlertDescription>
      </Alert>
    )
  }

  const foods = (foodsQuery.data ?? []).filter((food) => food.enabled !== false)
  const recentOrders = [...(ordersQuery.data ?? [])].sort((a, b) => b.id - a.id).slice(0, 3)
  const averagePrice = foods.length
    ? foods.reduce((sum, food) => sum + Number(food.price), 0) / foods.length
    : 0

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-serif text-4xl text-[#2f2a21] sm:text-5xl">Welcome back.</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Your table is always ready. Here is a summary of your recent culinary journeys and rewards.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card className="border-border/40 bg-[#f6f3eb] lg:col-span-1">
          <CardContent className="space-y-4 p-6">
            <p className="text-xs uppercase tracking-[0.14em] text-primary">Profile Summary</p>
            <div>
              <CardTitle className="font-serif text-3xl">Member Dashboard</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">Track orders, discover curated menu picks, and collect rewards.</p>
            </div>
            <Button asChild variant="outline">
              <Link
                to={ROUTES.orderHistory}
                onMouseEnter={() => prefetchRoute(ROUTES.orderHistory)}
                onFocus={() => prefetchRoute(ROUTES.orderHistory)}
                onTouchStart={() => prefetchRoute(ROUTES.orderHistory)}
              >
                View all history
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/30 bg-[#705a06] text-[#f6efdd] lg:col-span-2">
          <CardContent className="space-y-4 p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.14em] text-[#f0deaa]">Gourmet Rewards</p>
            <p className="font-serif text-5xl leading-none sm:text-6xl">
              12,450 <span className="text-2xl">pts</span>
            </p>
            <p className="max-w-xl text-sm text-[#f4e8c4]">You're one curated tasting menu away from your next reward.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary">Redeem Points</Button>
              <Button variant="ghost" className="text-[#f6efdd] hover:bg-white/10 hover:text-[#f6efdd]">View Benefits</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-full border border-border bg-secondary/60 px-3 py-2 text-xs">
          <span className="inline-flex items-center gap-1"><ListChecks className="size-3.5 text-primary" /> Total Foods: </span>
          <span className="font-semibold">{foods.length}</span>
        </div>
        <div className="rounded-full border border-border bg-secondary/60 px-3 py-2 text-xs">
          <span className="inline-flex items-center gap-1"><CircleDollarSign className="size-3.5 text-primary" /> Average Price: </span>
          <span className="font-semibold">€{averagePrice.toFixed(2)}</span>
        </div>
        <div className="rounded-full border border-border bg-secondary/60 px-3 py-2 text-xs">
          <span className="inline-flex items-center gap-1"><BadgeCheck className="size-3.5 text-primary" /> Status: </span>
          <span className="font-semibold text-primary">Open</span>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-border/50 bg-[#f3f0e8]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-5 py-4 sm:px-7">
          <div>
            <h2 className="font-serif text-3xl text-[#2f2a21]">Recent Orders</h2>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Your latest culinary experiences</p>
          </div>
          <Button asChild variant="outline">
            <Link
              to={ROUTES.orderHistory}
              onMouseEnter={() => prefetchRoute(ROUTES.orderHistory)}
              onFocus={() => prefetchRoute(ROUTES.orderHistory)}
              onTouchStart={() => prefetchRoute(ROUTES.orderHistory)}
            >
              Full order history
            </Link>
          </Button>
        </div>

        <div className="divide-y divide-border/30 bg-card/60">
          {recentOrders.length === 0 ? (
            <div className="px-6 py-10 text-sm text-muted-foreground">No orders yet. Start your first selection from shop.</div>
          ) : (
            recentOrders.map((order) => (
              <article key={order.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div className="flex items-center gap-3">
                  <div className="size-12 overflow-hidden rounded-lg bg-muted">
                    {foods[0]?.imageUrl ? (
                      <img
                        src={resolveBackendUrl(foods[0].imageUrl) ?? undefined}
                        alt={foods[0].name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[#d9cfb7] to-[#f1e8d4]" />
                    )}
                  </div>
                  <div>
                    <p className="font-serif text-lg text-[#2f2a21]">Order #{order.id}</p>
                    <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Total €{Number(order.totalPrice).toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to={`${ROUTES.orderTracking}/${order.id}`}
                      onMouseEnter={() => prefetchRoute(ROUTES.orderTracking)}
                      onFocus={() => prefetchRoute(ROUTES.orderTracking)}
                      onTouchStart={() => prefetchRoute(ROUTES.orderTracking)}
                    >
                      Track
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link
                      to={ROUTES.shop}
                      onMouseEnter={() => prefetchRoute(ROUTES.shop)}
                      onFocus={() => prefetchRoute(ROUTES.shop)}
                      onTouchStart={() => prefetchRoute(ROUTES.shop)}
                    >
                      <Repeat2 className="mr-1 size-4" />
                      Reorder
                    </Link>
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
