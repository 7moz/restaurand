import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { StompSubscription } from '@stomp/stompjs'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Spinner } from '../components/ui/spinner'
import { orderApi } from '../api'
import { ROUTES } from '../constants/routes'
import { useAuth } from '../context/auth-context'
import { useLanguage } from '../context/language-context'
import { OrderWebSocketClient } from '../lib/order-websocket'
import type { OrderResponseDTO, OrderSocketEvent, OrderStatus } from '../types/dashboard'

const statusStyle: Record<OrderStatus, string> = {
  PENDING: 'bg-slate-200 text-slate-700 border border-slate-300',
  ACCEPTED: 'bg-cyan-100 text-cyan-700 border border-cyan-200',
  PREPARING: 'bg-amber-100 text-amber-700 border border-amber-200',
  READY_FOR_PICKUP: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  COMPLETED: 'bg-blue-100 text-blue-700 border border-blue-200',
}

function formatPickupTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

function formatCurrency(value: number) {
  return `€${Number(value).toFixed(2)}`
}

function normalizeError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = typeof error.response?.data?.message === 'string' ? error.response.data.message : error.message
    return `HTTP ${error.response?.status ?? 'ERR'}: ${message}`
  }

  return error instanceof Error ? error.message : 'Unexpected error'
}

export function AdminOrdersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { token, logout } = useAuth()
  const { t } = useLanguage()
  const [isSocketConnected, setIsSocketConnected] = useState(false)
  const [liveMessage, setLiveMessage] = useState('')
  const [orders, setOrders] = useState<OrderResponseDTO[]>([])
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  const socketRef = useRef<OrderWebSocketClient | null>(null)
  const subscriptionRef = useRef<StompSubscription | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  const statusActions: Array<{ label: string; value: OrderStatus }> = [
    { label: t('adminOrders.accept'), value: 'ACCEPTED' },
    { label: t('adminOrders.setPreparing'), value: 'PREPARING' },
    { label: t('adminOrders.markReady'), value: 'READY_FOR_PICKUP' },
    { label: t('adminOrders.markCompleted'), value: 'COMPLETED' },
  ]

  const statusLabels: Record<OrderStatus, string> = {
    PENDING: t('adminOrders.pending'),
    ACCEPTED: t('adminOrders.accepted'),
    PREPARING: t('adminOrders.preparing'),
    READY_FOR_PICKUP: t('adminOrders.readyForPickup'),
    COMPLETED: t('adminOrders.completed'),
  }

  const ordersQuery = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => (await orderApi.getAllOrders(token)).data,
    refetchInterval: isSocketConnected ? false : 7000,
    retry: false,
  })

  const statusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: OrderStatus }) => {
      return (await orderApi.updateOrderStatus(orderId, status, token)).data
    },
    onSuccess: (updatedOrder) => {
      setOrders((previous) => previous.map((item) => (item.id === updatedOrder.id ? updatedOrder : item)))
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    },
  })

  useEffect(() => {
    if (ordersQuery.data) {
      setOrders(ordersQuery.data)
    }
  }, [ordersQuery.data])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const syncPreference = () => {
      const reduce = mediaQuery.matches
      setPrefersReducedMotion(reduce)

      if (reduce) {
        setSoundEnabled(false)
      }
    }

    syncPreference()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncPreference)
      return () => mediaQuery.removeEventListener('change', syncPreference)
    }

    mediaQuery.addListener(syncPreference)
    return () => mediaQuery.removeListener(syncPreference)
  }, [])

  const playNotificationSound = () => {
    if (!soundEnabled || prefersReducedMotion) {
      return
    }

    try {
      if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
        return
      }

      const context = audioContextRef.current ?? new window.AudioContext()
      audioContextRef.current = context

      const start = context.currentTime
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()

      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(880, start)
      oscillator.frequency.exponentialRampToValueAtTime(660, start + 0.2)

      gainNode.gain.setValueAtTime(0.0001, start)
      gainNode.gain.exponentialRampToValueAtTime(0.12, start + 0.02)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + 0.22)

      oscillator.connect(gainNode)
      gainNode.connect(context.destination)

      if (context.state === 'suspended') {
        void context.resume()
      }

      oscillator.start(start)
      oscillator.stop(start + 0.24)
    } catch {
      // Ignore audio errors so notifications never disrupt order flow.
    }
  }

  useEffect(() => {
    if (!token) {
      return
    }

    const connect = () => {
      const client = new OrderWebSocketClient()
      socketRef.current = client

      client.connect(
        () => {
          setIsSocketConnected(true)
          setLiveMessage('')

          subscriptionRef.current = client.subscribe<OrderSocketEvent>('/topic/orders', async (event) => {
            setLiveMessage(t('adminOrders.newOrderReceived', { id: String(event.orderId) }))
            playNotificationSound()

            try {
              const response = await orderApi.getOrderById(event.orderId, token)
              const incomingOrder = response.data

              setOrders((previous) => {
                const filtered = previous.filter((item) => item.id !== incomingOrder.id)
                return [incomingOrder, ...filtered]
              })
            } catch {
              queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
            }
          })
        },
        () => {
          setIsSocketConnected(false)
          setLiveMessage(t('adminOrders.connectionWarning'))

          reconnectTimerRef.current = window.setTimeout(() => {
            connect()
          }, 3000)
        },
      )
    }

    connect()

    return () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current)
      }
      subscriptionRef.current?.unsubscribe()
      socketRef.current?.disconnect()
    }
  }, [token, queryClient])

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    if (!liveMessage) {
      return
    }

    const timerId = window.setTimeout(() => setLiveMessage(''), 3200)
    return () => window.clearTimeout(timerId)
  }, [liveMessage])

  const sortedOrders = useMemo(() => {
    const list = [...orders]
    list.sort((a, b) => b.id - a.id)
    return list
  }, [orders])

  const statusCounts = useMemo(() => {
    const counts: Record<OrderStatus, number> = {
      PENDING: 0,
      ACCEPTED: 0,
      PREPARING: 0,
      READY_FOR_PICKUP: 0,
      COMPLETED: 0,
    }

    for (const order of sortedOrders) {
      counts[order.status] += 1
    }

    return counts
  }, [sortedOrders])

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return sortedOrders.filter((order) => {
      const statusOk = statusFilter === 'ALL' || order.status === statusFilter
      if (!statusOk) {
        return false
      }

      if (!term) {
        return true
      }

      return String(order.id).includes(term) || order.phone.toLowerCase().includes(term)
    })
  }, [sortedOrders, statusFilter, searchTerm])

  const handleUnauthorized = async () => {
    await logout()
    navigate(ROUTES.login, { replace: true, state: { from: ROUTES.adminOrders } })
  }

  if (ordersQuery.error && axios.isAxiosError(ordersQuery.error)) {
    const status = ordersQuery.error.response?.status
    if (status === 401 || status === 403) {
      void handleUnauthorized()
    }
  }

  const updateStatus = async (orderId: number, status: OrderStatus) => {
    try {
      await statusMutation.mutateAsync({ orderId, status })
    } catch (error) {
      if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        await handleUnauthorized()
      }
    }
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
        <AlertTitle>{t('adminOrders.unableToLoadOrders')}</AlertTitle>
        <AlertDescription>{normalizeError(ordersQuery.error)}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {liveMessage ? (
        <Alert variant={isSocketConnected ? 'success' : 'default'}>
          <AlertTitle>{isSocketConnected ? t('adminOrders.liveUpdate') : t('adminOrders.connectionWarning')}</AlertTitle>
          <AlertDescription>{liveMessage}</AlertDescription>
        </Alert>
      ) : null}

      <section className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm sm:p-8">
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">{t('adminOrders.ordersManagement')}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t('adminOrders.subtitle')}
        </p>
      </section>

      <section className="sticky top-2 z-20 rounded-2xl border border-border/70 bg-card/85 p-4 backdrop-blur md:static md:bg-card/70 md:backdrop-blur-none">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t('adminOrders.searchByOrderIdOrPhone')}
            className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring md:h-10"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'ALL' | OrderStatus)}
            className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring md:h-10"
          >
            <option value="ALL">{t('adminOrders.allStatuses')}</option>
            <option value="PENDING">{t('adminOrders.pending')}</option>
            <option value="ACCEPTED">{t('adminOrders.accepted')}</option>
            <option value="PREPARING">{t('adminOrders.preparing')}</option>
            <option value="READY_FOR_PICKUP">{t('adminOrders.readyForPickup')}</option>
            <option value="COMPLETED">{t('adminOrders.completed')}</option>
          </select>

          <Button
            type="button"
            variant={soundEnabled ? 'secondary' : 'outline'}
            className="h-11 md:h-10"
            disabled={prefersReducedMotion}
            onClick={() => setSoundEnabled((previous) => !previous)}
          >
            {prefersReducedMotion ? t('adminOrders.soundDisabledReducedMotion') : soundEnabled ? t('adminOrders.soundOn') : t('adminOrders.soundOff')}
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatusSummaryCard title={t('adminOrders.inPreparation')} value={statusCounts.PREPARING} tone="warm" />
        <StatusSummaryCard title={t('adminOrders.pending')} value={statusCounts.PENDING} tone="muted" />
        <StatusSummaryCard title={t('adminOrders.ready')} value={statusCounts.READY_FOR_PICKUP} tone="ok" />
        <StatusSummaryCard title={t('adminOrders.completed')} value={statusCounts.COMPLETED} tone="neutral" />
      </section>

      {statusMutation.isError ? (
        <Alert variant="destructive">
          <AlertTitle>{t('adminOrders.statusUpdateFailed')}</AlertTitle>
          <AlertDescription>{normalizeError(statusMutation.error)}</AlertDescription>
        </Alert>
      ) : null}

      {filteredOrders.length === 0 ? (
        <Card className="border-border/70">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">{t('adminOrders.noMatchingOrders')}</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isUpdating={statusMutation.isPending}
              onUpdateStatus={updateStatus}
              statusLabels={statusLabels}
              statusActions={statusActions}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StatusSummaryCard({
  title,
  value,
  tone,
}: {
  title: string
  value: number
  tone: 'warm' | 'muted' | 'ok' | 'neutral'
}) {
  const toneClass = {
    warm: 'bg-amber-50 border-amber-200 text-amber-800',
    muted: 'bg-slate-50 border-slate-200 text-slate-700',
    ok: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    neutral: 'bg-secondary/40 border-border text-foreground',
  }[tone]

  return (
    <Card className={`border ${toneClass}`}>
      <CardContent className="p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em]">{title}</p>
        <p className="mt-2 font-serif text-3xl">{value}</p>
      </CardContent>
    </Card>
  )
}

function OrderCard({
  order,
  isUpdating,
  onUpdateStatus,
  statusLabels,
  statusActions,
  t,
}: {
  order: OrderResponseDTO
  isUpdating: boolean
  onUpdateStatus: (orderId: number, status: OrderStatus) => Promise<void>
  statusLabels: Record<OrderStatus, string>
  statusActions: Array<{ label: string; value: OrderStatus }>
  t: (key: string, values?: Record<string, string>) => string
}) {
  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">{t('adminOrders.orderNumber', { id: String(order.id) })}</CardTitle>
            <CardDescription className="mt-2 space-y-1">
              {order.fullName?.trim() ? <div>{t('adminOrders.client')}: {order.fullName}</div> : null}
              <div>{t('adminOrders.phone')}: {order.phone}</div>
              <div>{t('adminOrders.pickup')}: {formatPickupTime(order.pickupTime)}</div>
              <div>{t('adminOrders.total')}: {formatCurrency(order.totalPrice)}</div>
            </CardDescription>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${statusStyle[order.status]}`}>
            {statusLabels[order.status]}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {order.note?.trim() ? (
          <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
            <p className="mb-1 text-sm font-semibold text-foreground">{t('adminOrders.clientNote')}</p>
            <p className="text-sm text-muted-foreground break-words">{order.note}</p>
          </div>
        ) : null}

        <div className="rounded-xl border border-border/60 p-3">
          <p className="mb-2 text-sm font-semibold text-foreground">{t('adminOrders.items')}</p>
          <ul className="space-y-2 text-sm">
            {order.items.map((item) => (
              <li key={`${order.id}-${item.menuItemId}`} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <span className="text-muted-foreground break-words">
                  {item.menuItemName} x {item.quantity}
                </span>
                <span className="font-medium text-foreground sm:text-right">{formatCurrency(Number(item.price) * item.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {statusActions.map((action) => (
            <Button
              key={action.value}
              size="sm"
              className="h-11 shrink-0 px-4 text-sm sm:h-9 sm:text-xs"
              variant={order.status === action.value ? 'secondary' : 'outline'}
              disabled={isUpdating || order.status === action.value}
              onClick={() => void onUpdateStatus(order.id, action.value)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
