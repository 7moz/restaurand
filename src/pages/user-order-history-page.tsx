import { useMemo, useState } from 'react'
import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { foodApi, orderApi } from '../api'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '../components/ui/card'
import { Spinner } from '../components/ui/spinner'
import { Toast } from '../components/ui/toast'
import { ROUTES } from '../constants/routes'
import { useAuth } from '../context/auth-context'
import { useCart } from '../context/cart-context'
import type { OrderResponseDTO, OrderStatus } from '../types/dashboard'

const statusStyle: Record<OrderStatus, string> = {
  PENDING: 'bg-slate-200 text-slate-700 border border-slate-300',
  ACCEPTED: 'bg-cyan-100 text-cyan-700 border border-cyan-200',
  PREPARING: 'bg-amber-100 text-amber-700 border border-amber-200',
  READY_FOR_PICKUP: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  COMPLETED: 'bg-primary/15 text-primary border border-primary/25',
}

function formatPickupTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString()
}

function normalizeError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = typeof error.response?.data?.message === 'string' ? error.response.data.message : error.message
    return `HTTP ${error.response?.status ?? 'ERR'}: ${message}`
  }

  return error instanceof Error ? error.message : 'Unexpected error'
}

function summarizeNames(names: string[]) {
  const unique = [...new Set(names)]
  if (unique.length === 0) {
    return ''
  }

  if (unique.length <= 3) {
    return unique.join(', ')
  }

  return `${unique.slice(0, 3).join(', ')} +${unique.length - 3} more`
}

type ReorderNotice = {
  id: number
  tone: 'success' | 'warning' | 'error' | 'info'
  title: string
  summary: string
  addedCount: number
  skippedCount: number
}

export function UserOrderHistoryPage() {
  const { token } = useAuth()
  const { addItem } = useCart()
  const [reorderNotice, setReorderNotice] = useState<ReorderNotice | null>(null)

  const showReorderNotice = (notice: Omit<ReorderNotice, 'id'>) => {
    setReorderNotice({ ...notice, id: Date.now() })
  }

  const ordersQuery = useQuery({
    queryKey: ['my-orders-history'],
    queryFn: async () => (await orderApi.getMyOrders(token)).data,
    retry: false,
  })

  const sortedOrders = useMemo(() => {
    const list: OrderResponseDTO[] = [...(ordersQuery.data ?? [])]
    list.sort((a, b) => b.id - a.id)
    return list
  }, [ordersQuery.data])

  const foodsQuery = useQuery({
    queryKey: ['foods-for-reorder'],
    queryFn: async () => (await foodApi.getAllFoods(token)).data,
    retry: false,
  })

  const foodEnabledMap = useMemo(() => {
    const map = new Map<number, boolean>()

    for (const food of foodsQuery.data ?? []) {
      map.set(food.id, food.enabled !== false)
    }

    return map
  }, [foodsQuery.data])

  const foodExistsSet = useMemo(() => {
    return new Set((foodsQuery.data ?? []).map((food) => food.id))
  }, [foodsQuery.data])

  const handleReorder = (order: OrderResponseDTO) => {
    if (foodsQuery.isLoading) {
      showReorderNotice({
        tone: 'info',
        title: 'Checking menu availability',
        summary: 'Please try reorder again in a moment while we refresh menu status.',
        addedCount: 0,
        skippedCount: 0,
      })
      return
    }

    if (foodsQuery.isError) {
      showReorderNotice({
        tone: 'error',
        title: 'Unable to verify menu',
        summary: 'We could not check menu availability right now. Please try again shortly.',
        addedCount: 0,
        skippedCount: 0,
      })
      return
    }

    let addedCount = 0
    let skippedCount = 0
    const disabledNames: string[] = []
    const removedNames: string[] = []

    for (const item of order.items) {
      const exists = foodExistsSet.has(item.menuItemId)
      const isEnabled = foodEnabledMap.get(item.menuItemId)

      if (!exists) {
        removedNames.push(item.menuItemName)
        skippedCount += item.quantity
        continue
      }

      if (isEnabled !== true) {
        disabledNames.push(item.menuItemName)
        skippedCount += item.quantity
        continue
      }

      for (let i = 0; i < item.quantity; i += 1) {
        addItem({
          id: item.menuItemId,
          menuId: 0,
          name: item.menuItemName,
          description: '',
          price: item.price,
          imageUrl: null,
        })
      }
      addedCount += item.quantity
    }

    const disabledSummary = summarizeNames(disabledNames)
    const removedSummary = summarizeNames(removedNames)
    const detailParts = [disabledSummary ? `Disabled: ${disabledSummary}.` : '', removedSummary ? `Removed: ${removedSummary}.` : ''].filter(Boolean)
    const details = detailParts.length > 0 ? ` ${detailParts.join(' ')}` : ''

    if (addedCount === 0) {
      showReorderNotice({
        tone: 'error',
        title: 'No items could be reordered',
        summary: `Order #${order.id} has no currently available items.${details}`,
        addedCount,
        skippedCount,
      })
      return
    }

    const skippedLabel = skippedCount > 0 ? ` Skipped ${skippedCount} unavailable item(s).${details}` : ''
    showReorderNotice({
      tone: skippedCount > 0 ? 'warning' : 'success',
      title: skippedCount > 0 ? 'Partially reordered' : 'Reorder successful',
      summary: `Added ${addedCount} item(s) to cart from order #${order.id}.${skippedLabel}`,
      addedCount,
      skippedCount,
    })
  }

  if (ordersQuery.isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (ordersQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load order history</AlertTitle>
        <AlertDescription>{normalizeError(ordersQuery.error)}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3 rounded-3xl bg-[#f3f1ea] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Past Experiences</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-5xl leading-[0.95] text-[#2f2a21] sm:text-6xl">Order History</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Relive your culinary journeys and access every order details page from one place.
            </p>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link to={ROUTES.shop}>
              <ArrowLeft className="size-4" />
              Back to shop
            </Link>
          </Button>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-secondary px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">All Status</span>
          <span className="rounded-full bg-secondary px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Recent First</span>
        </div>
        <p className="text-xs italic text-muted-foreground">Showing {sortedOrders.length} order(s)</p>
      </section>

      {sortedOrders.length === 0 ? (
        <Card className="border-border/70">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You have no orders yet.
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-3 rounded-3xl bg-[#f3f1ea] p-3 sm:p-4">
          <div className="hidden grid-cols-12 gap-3 rounded-2xl bg-[#e8e4da] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground lg:grid">
            <span className="col-span-2">Date</span>
            <span className="col-span-2">Order ID</span>
            <span className="col-span-3">Summary</span>
            <span className="col-span-1">Total</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-2 text-right">Actions</span>
          </div>

          {sortedOrders.map((order) => (
            <article
              key={order.id}
              className="grid gap-4 rounded-2xl border border-border/30 bg-card px-5 py-4 shadow-sm transition-colors hover:bg-[#fbfaf7] lg:grid-cols-12 lg:items-center"
            >
              <div className="lg:col-span-2">
                <p className="text-sm font-semibold text-[#2f2a21]">{formatDate(order.pickupTime)}</p>
                <p className="text-[11px] text-muted-foreground">{formatPickupTime(order.pickupTime)}</p>
              </div>

              <div className="lg:col-span-2">
                <p className="font-mono text-xs text-muted-foreground">#MAITRE-{order.id}</p>
              </div>

              <div className="lg:col-span-3">
                <CardTitle className="font-serif text-xl text-[#2f2a21]">Order #{order.id}</CardTitle>
                <CardDescription>{order.items.length} item(s) in this order</CardDescription>
              </div>

              <div className="lg:col-span-1">
                <p className="text-sm font-semibold">€{Number(order.totalPrice).toFixed(2)}</p>
              </div>

              <div className="lg:col-span-2">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${statusStyle[order.status]}`}>
                  {order.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 lg:col-span-2 lg:justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReorder(order)}
                >
                  Reorder
                </Button>
                <Button asChild size="sm">
                  <Link to={`${ROUTES.orderTracking}/${order.id}`}>View Order</Link>
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}

      <Toast
        open={Boolean(reorderNotice)}
        noticeId={reorderNotice?.id}
        tone={reorderNotice?.tone ?? 'info'}
        title={reorderNotice?.title ?? ''}
        summary={reorderNotice?.summary ?? ''}
        addedCount={reorderNotice?.addedCount ?? 0}
        skippedCount={reorderNotice?.skippedCount ?? 0}
        durationMs={3000}
        onClose={() => setReorderNotice(null)}
      />
    </div>
  )
}
