import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { StompSubscription } from '@stomp/stompjs'
import { jsPDF } from 'jspdf'
import {
  BadgeCheck,
  ChefHat,
  CircleCheckBig,
  Clock3,
  Download,
  ArrowRight,
  MapPin,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react'
import { orderApi } from '../api'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { OrderStatusProgress } from '../components/ui/order-status-progress'
import { Spinner } from '../components/ui/spinner'
import { ROUTES } from '../constants/routes'
import { useAuth } from '../context/auth-context'
import { useLanguage } from '../context/language-context'
import { OrderWebSocketClient } from '../lib/order-websocket'
import type { OrderResponseDTO, OrderSocketEvent } from '../types/dashboard'

const statusTimelineTemplate = [
  {
    status: 'PENDING' as const,
    labelKey: 'orderTracking.statusPending',
    icon: CircleCheckBig,
    activeClassName: 'bg-primary text-primary-foreground shadow-lg shadow-primary/20',
    inactiveClassName: 'bg-muted text-muted-foreground',
  },
  {
    status: 'ACCEPTED' as const,
    labelKey: 'orderTracking.statusAccepted',
    icon: BadgeCheck,
    activeClassName: 'bg-primary text-primary-foreground shadow-lg shadow-primary/20',
    inactiveClassName: 'bg-muted text-muted-foreground',
  },
  {
    status: 'PREPARING' as const,
    labelKey: 'orderTracking.statusPreparing',
    icon: UtensilsCrossed,
    activeClassName: 'bg-amber-100 text-amber-700 ring-4 ring-amber-200/40',
    inactiveClassName: 'bg-muted text-muted-foreground',
  },
  {
    status: 'READY_FOR_PICKUP' as const,
    labelKey: 'orderTracking.statusReadyForPickup',
    icon: ChefHat,
    activeClassName: 'bg-emerald-100 text-emerald-700 ring-4 ring-emerald-200/40',
    inactiveClassName: 'bg-muted text-muted-foreground',
  },
  {
    status: 'COMPLETED' as const,
    labelKey: 'orderTracking.statusCompleted',
    icon: Sparkles,
    activeClassName: 'bg-sky-100 text-sky-700',
    inactiveClassName: 'bg-muted text-muted-foreground',
  },
] as const

function formatPickupTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

function normalizeError(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError(error)) {
    const message = typeof error.response?.data?.message === 'string' ? error.response.data.message : error.message
    return `HTTP ${error.response?.status ?? 'ERR'}: ${message}`
  }

  return error instanceof Error ? error.message : fallbackMessage
}

function downloadReceipt(order: OrderResponseDTO, t: (key: string, values?: Record<string, string>) => string) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const left = 48
  const right = pageWidth - 48
  const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
  const subtotal = order.items.reduce((total, item) => total + Number(item.price) * item.quantity, 0)
  const tableWidth = right - left
  const itemX = left + 10
  const qtyX = left + tableWidth * 0.68
  const amountX = right - 10

  const drawItemsHeader = (cursorY: number) => {
    pdf.setFillColor(245, 244, 239)
    pdf.roundedRect(left, cursorY - 14, tableWidth, 24, 8, 8, 'F')
    pdf.setFontSize(10)
    pdf.setTextColor(80, 69, 50)
    pdf.text(t('orderTracking.receiptItem'), itemX, cursorY)
    pdf.text(t('orderTracking.receiptQty'), qtyX, cursorY, { align: 'center' })
    pdf.text(t('orderTracking.receiptAmount'), amountX, cursorY, { align: 'right' })
  }

  pdf.setFillColor(243, 241, 234)
  pdf.rect(0, 0, pageWidth, 122, 'F')
  pdf.setFillColor(115, 92, 0)
  pdf.rect(0, 0, pageWidth, 8, 'F')
  pdf.setTextColor(27, 28, 25)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(24)
  pdf.text(t('orderTracking.receiptBrand'), left, 46)
  pdf.text(t('orderTracking.receiptTitle'), left, 72)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  pdf.text(`Order #${order.id}`, left, 95)
  pdf.text(`${t('orderTracking.receiptPickupTime')}: ${formatPickupTime(order.pickupTime)}`, 300, 95)
  pdf.text(`${t('orderTracking.phone')}: ${order.phone}`, left, 111)

  let cursorY = 164
  pdf.setTextColor(27, 28, 25)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.text(t('orderTracking.receiptItems'), left, cursorY)
  cursorY += 16

  pdf.setDrawColor(224, 218, 205)
  pdf.line(left, cursorY, right, cursorY)
  cursorY += 18

  drawItemsHeader(cursorY)
  cursorY += 24

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)

  order.items.forEach((item, index) => {
    const amount = Number(item.price) * item.quantity
    const itemNameLines = pdf.splitTextToSize(item.menuItemName, 290)
    const rowHeight = Math.max(34, itemNameLines.length * 14 + 12)

    if (cursorY + rowHeight > pageHeight - 120) {
      pdf.addPage()
      cursorY = 64
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(14)
      pdf.setTextColor(27, 28, 25)
      pdf.text(t('orderTracking.receiptItemsContinued'), left, cursorY)
      cursorY += 18
      pdf.setDrawColor(224, 218, 205)
      pdf.line(left, cursorY, right, cursorY)
      cursorY += 18
      drawItemsHeader(cursorY)
      cursorY += 24
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(11)
    }

    const rowTop = cursorY - 12
    if (index % 2 === 0) {
      pdf.setFillColor(250, 249, 244)
      pdf.roundedRect(left, rowTop, tableWidth, rowHeight, 8, 8, 'F')
    }

    pdf.setTextColor(27, 28, 25)
    pdf.text(itemNameLines, itemX, cursorY)
    pdf.setTextColor(80, 69, 50)
    pdf.text(`${item.quantity}`, qtyX, cursorY, { align: 'center' })
    pdf.text(currency.format(amount), amountX, cursorY, { align: 'right' })
    cursorY += rowHeight
  })

  cursorY += 10
  pdf.setDrawColor(224, 218, 205)
  pdf.line(left, cursorY, right, cursorY)
  cursorY += 24

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  pdf.text(t('orderTracking.subtotal'), left, cursorY)
  pdf.text(currency.format(subtotal), right - 10, cursorY, { align: 'right' })
  cursorY += 18
  pdf.setFont('helvetica', 'bold')
  pdf.text(t('orderTracking.receiptTotal'), left, cursorY)
  pdf.setFont('helvetica', 'bold')
  pdf.text(currency.format(Number(order.totalPrice)), right - 10, cursorY, { align: 'right' })

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(80, 69, 50)
  pdf.text(t('orderTracking.receiptThankYou'), left, pageHeight - 44)
  pdf.text(t('orderTracking.receiptKeepForRecords'), left, pageHeight - 28)

  pdf.save(`receipt-order-${order.id}.pdf`)
}

export function OrderTrackingPage() {
  const navigate = useNavigate()
  const { orderId } = useParams()
  const { token, logout } = useAuth()
  const { t } = useLanguage()

  const orderIdNumber = Number(orderId)
  const isOrderIdValid = Number.isInteger(orderIdNumber) && orderIdNumber > 0

  const socketRef = useRef<OrderWebSocketClient | null>(null)
  const subscriptionRef = useRef<StompSubscription | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)

  const [isSocketConnected, setIsSocketConnected] = useState(false)
  const [socketError, setSocketError] = useState<string>('')
  const [toastMessage, setToastMessage] = useState<string>('')
  const [liveOrder, setLiveOrder] = useState<OrderResponseDTO | null>(null)

  const statusLabelByStatus: Record<string, string> = {
    PENDING: t('orderTracking.statusPending'),
    ACCEPTED: t('orderTracking.statusAccepted'),
    PREPARING: t('orderTracking.statusPreparing'),
    READY_FOR_PICKUP: t('orderTracking.statusReadyForPickup'),
    COMPLETED: t('orderTracking.statusCompleted'),
  }

  const statusTimeline = statusTimelineTemplate.map((entry) => ({
    ...entry,
    label: statusLabelByStatus[entry.status] ?? entry.status,
  }))

  const orderQuery = useQuery({
    queryKey: ['order-tracking', orderIdNumber],
    enabled: isOrderIdValid,
    queryFn: async () => (await orderApi.getOrderById(orderIdNumber, token)).data,
    refetchInterval: isSocketConnected ? false : 5000,
    retry: false,
  })

  useEffect(() => {
    if (orderQuery.data) {
      setLiveOrder(orderQuery.data)
    }
  }, [orderQuery.data])

  const handleUnauthorized = async () => {
    await logout()
    navigate(ROUTES.login, { replace: true, state: { from: `${ROUTES.orderTracking}/${orderIdNumber}` } })
  }

  useEffect(() => {
    if (orderQuery.error && axios.isAxiosError(orderQuery.error)) {
      const status = orderQuery.error.response?.status
      if (status === 401 || status === 403) {
        void handleUnauthorized()
      }
    }
  }, [orderQuery.error])

  useEffect(() => {
    if (!isOrderIdValid) {
      return
    }

    const connect = () => {
      const client = new OrderWebSocketClient()
      socketRef.current = client

      client.connect(
        () => {
          setSocketError('')
          setIsSocketConnected(true)

          subscriptionRef.current = client.subscribe<OrderSocketEvent>(`/topic/orders/${orderIdNumber}`, (event) => {
            setLiveOrder((previous) => {
              if (!previous) {
                return previous
              }

              if (previous.status !== event.status) {
                const translatedStatus = statusLabelByStatus[event.status] ?? event.status
                setToastMessage(t('orderTracking.orderStatusChanged', { orderId: String(event.orderId), status: translatedStatus }))
              }

              return {
                ...previous,
                status: event.status,
                pickupTime: event.pickupTime,
                totalPrice: Number(event.totalPrice),
              }
            })
          })
        },
        () => {
          setIsSocketConnected(false)
          setSocketError(t('orderTracking.liveUpdatesDisconnected'))

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
  }, [isOrderIdValid, orderIdNumber])

  useEffect(() => {
    if (!toastMessage) {
      return
    }

    const timerId = window.setTimeout(() => setToastMessage(''), 3200)
    return () => window.clearTimeout(timerId)
  }, [toastMessage])

  const activeOrder = useMemo(() => liveOrder ?? orderQuery.data ?? null, [liveOrder, orderQuery.data])
  const subtotal = activeOrder?.items.reduce((total, item) => total + Number(item.price) * item.quantity, 0) ?? 0
  const activeStatusIndex = activeOrder ? statusTimeline.findIndex((entry) => entry.status === activeOrder.status) : -1
  const directionsUrl = 'https://www.google.com/maps/search/?api=1&query=48.88573784494155,2.3816335134943807'

  if (!isOrderIdValid) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('orderTracking.invalidOrderLink')}</AlertTitle>
        <AlertDescription>{t('orderTracking.invalidOrderId')}</AlertDescription>
      </Alert>
    )
  }

  if (orderQuery.isLoading && !activeOrder) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (orderQuery.isError && !activeOrder) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('orderTracking.unableToLoadOrder')}</AlertTitle>
        <AlertDescription>{normalizeError(orderQuery.error, t('orderTracking.unexpectedError'))}</AlertDescription>
      </Alert>
    )
  }

  if (!activeOrder) {
    return null
  }

  return (
    <div className="relative space-y-6 overflow-hidden">
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 top-80 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl" />
      {toastMessage ? (
        <Alert variant="success">
          <AlertTitle>{t('orderTracking.statusUpdated')}</AlertTitle>
          <AlertDescription>{toastMessage}</AlertDescription>
        </Alert>
      ) : null}

      {!isSocketConnected && socketError ? (
        <Alert>
          <AlertTitle>{t('orderTracking.realtimeUnavailable')}</AlertTitle>
          <AlertDescription>{socketError}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
        <Card className="border-border/40 bg-[#f3f1ea] shadow-sm">
          <CardHeader className="space-y-3 border-b border-border/50 bg-background/50">
            <div className="grid gap-4 md:grid-cols-12 md:items-end">
              <div className="space-y-2 md:col-span-8">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t('orderTracking.currentOrderStatus')}</p>
                <CardTitle className="max-w-3xl text-4xl leading-[0.95] sm:text-6xl">
                  {t('orderTracking.heroTitlePrefix')} <span className="italic text-primary">{t('orderTracking.heroTitleHighlight')}</span>
                </CardTitle>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background px-4 py-3 text-right md:col-span-4 md:justify-self-end md:self-end md:pb-2">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t('orderTracking.orderIdentifier')}</p>
                <p className="mt-1 text-lg font-semibold">#{activeOrder.id}</p>
                <p className="mt-1 flex items-center justify-end gap-2 text-xs text-muted-foreground">
                  <Clock3 className="size-3.5" />
                  {isSocketConnected ? t('orderTracking.liveUpdatesOn') : t('orderTracking.pollingFallbackMode')}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="rounded-3xl border border-border/60 bg-background p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t('orderTracking.kitchenProgress')}</span>
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t('orderTracking.liveTracking')}</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-5">
                {statusTimeline.map((step, index) => {
                  const Icon = step.icon
                  const completed = index <= activeStatusIndex

                  return (
                    <div key={step.status} className="flex flex-col items-center text-center">
                      <div
                        className={`mb-3 flex size-11 items-center justify-center rounded-full transition-colors ${completed ? step.activeClassName : step.inactiveClassName}`}
                      >
                        <Icon className="size-5" />
                      </div>
                      <p className={`text-[10px] uppercase tracking-[0.18em] ${completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.label}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className="mt-5">
                <OrderStatusProgress status={activeOrder.status} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
              <article className="overflow-hidden rounded-3xl border border-border/60 bg-background shadow-sm">
                <div className="border-b border-border/50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <MapPin className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t('orderTracking.location')}</p>
                      <h3 className="text-lg font-semibold">{t('orderTracking.pickUpYourOrder')}</h3>
                    </div>
                  </div>
                </div>
                <div className="relative h-[240px] overflow-hidden">
                  <iframe
                    title={t('orderTracking.restaurantLocationMap')}
                    src="https://maps.google.com/maps?q=48.88573784494155,2.3816335134943807&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="border-t border-border/50 p-5">
                  <Button asChild className="w-full" type="button" variant="outline">
                    <a href={directionsUrl} rel="noreferrer" target="_blank">
                      {t('orderTracking.getDirections')}
                    </a>
                  </Button>
                </div>
              </article>

              <article className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t('orderTracking.pickupTime')}</p>
                <p className="mt-2 text-2xl font-semibold">{formatPickupTime(activeOrder.pickupTime)}</p>
                <div className="mt-6 space-y-3 rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <BadgeCheck className="mt-0.5 size-4 text-primary" />
                    {t('orderTracking.reservedForPickup')}
                  </p>
                  <p className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 size-4 text-primary" />
                    {t('orderTracking.keepPageOpen')}
                  </p>
                </div>
              </article>
            </div>
          </CardContent>
        </Card>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <Card className="border-border/40 bg-card shadow-sm">
            <CardHeader className="space-y-1 border-b border-border/50">
              <CardTitle className="text-3xl">{t('orderTracking.orderSummary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              <div className="space-y-4">
                {activeOrder.items.map((item) => (
                  <div key={`${activeOrder.id}-${item.menuItemId}`} className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UtensilsCrossed className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{item.menuItemName}</p>
                        <p className="text-xs text-muted-foreground">{t('orderTracking.quantity')} {item.quantity}</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium">€{(Number(item.price) * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-border/60 pt-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{t('orderTracking.subtotal')}</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{t('orderTracking.status')}</span>
                  <span>{statusLabelByStatus[activeOrder.status] ?? activeOrder.status}</span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>{t('orderTracking.totalAmount')}</span>
                  <span>€{Number(activeOrder.totalPrice).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <button
            className="group flex w-full items-center justify-between rounded-2xl border border-border/40 bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/40"
            onClick={() => downloadReceipt(activeOrder, t)}
            type="button"
          >
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
                <Download className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t('orderTracking.receipt')}</p>
                <p className="text-sm font-semibold text-foreground">{t('orderTracking.downloadReceipt')}</p>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </button>

          <Card className="border-border/40 bg-primary text-primary-foreground shadow-sm">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/80">{t('orderTracking.needHelp')}</p>
                <p className="mt-1 font-medium">{t('orderTracking.contactDiningTeamAnytime')}</p>
              </div>
              <Button asChild variant="secondary">
                <Link to={ROUTES.contact}>{t('orderTracking.contactUs')}</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  )
}
