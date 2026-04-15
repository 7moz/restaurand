import { Link, useLocation } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { ROUTES } from '../constants/routes'
import type { OrderResponseDTO } from '../types/dashboard'
import { useLanguage } from '../context/language-context'

interface OrderConfirmationState {
  order?: OrderResponseDTO
}

function formatPickupTime(value: string | undefined, locale: string, fallbackText: string) {
  if (!value) {
    return fallbackText
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString(locale)
}

export function OrderConfirmationPage() {
  const { language, t } = useLanguage()
  const location = useLocation()
  const state = location.state as OrderConfirmationState | null
  const order = state?.order

  if (!order) {
    return (
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>{t('orderConfirmation.title')}</CardTitle>
          <CardDescription>{t('orderConfirmation.missingOrder')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to={ROUTES.shop}>{t('orderConfirmation.backToShop')}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const statuses = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED'] as const
  const currentStep = Math.max(0, statuses.indexOf(order.status))
  const statusLabelByCode: Record<(typeof statuses)[number], string> = {
    PENDING: t('orderConfirmation.statusPending'),
    ACCEPTED: t('orderConfirmation.statusAccepted'),
    PREPARING: t('orderConfirmation.statusPreparing'),
    READY_FOR_PICKUP: t('orderConfirmation.statusReadyForPickup'),
    COMPLETED: t('orderConfirmation.statusCompleted'),
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 rounded-3xl bg-[#f3f1ea] p-6 lg:grid-cols-[1fr_1.05fr] lg:p-8">
        <div className="space-y-4 self-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs uppercase tracking-[0.14em] text-primary">
            <CheckCircle2 className="size-4" /> {t('orderConfirmation.confirmed')}
          </p>
          <h1 className="text-5xl leading-[0.94] sm:text-6xl">{t('orderConfirmation.heroTitle')}</h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t('orderConfirmation.heroDescription')}
          </p>
        </div>
        <div className="space-y-4">
          <div className="h-[260px] rounded-2xl bg-[linear-gradient(145deg,#151515,#2e2e2e)]" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border-border/40 bg-card">
              <CardContent className="p-4 text-sm">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{t('orderConfirmation.referenceNumber')}</p>
                <p className="mt-2 text-lg font-semibold">#{order.id}</p>
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-card">
              <CardContent className="p-4 text-sm">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{t('orderConfirmation.totalInvestment')}</p>
                <p className="mt-2 text-lg font-semibold">€{Number(order.totalPrice).toFixed(2)}</p>
              </CardContent>
            </Card>
            <Button asChild className="h-full min-h-24">
              <Link to={`${ROUTES.orderTracking}/${order.id}`}>{t('orderConfirmation.trackOrder')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <Card className="border-border/40 bg-card">
        <CardHeader>
          <CardTitle className="text-3xl">{t('orderConfirmation.orderSummary')}</CardTitle>
          <CardDescription>
            {t('orderConfirmation.pickupAt', {
              time: formatPickupTime(order.pickupTime, language, t('orderConfirmation.notAvailable')),
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <ul className="space-y-3">
            {order.items.map((item) => (
              <li key={`${order.id}-${item.menuItemId}`} className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">
                  {item.menuItemName} x {item.quantity}
                </span>
                <span className="font-semibold">€{(Number(item.price) * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-border/70 pt-3">
            <p className="flex items-center justify-between text-lg font-semibold">
              <span>{t('orderConfirmation.grandTotal')}</span>
              <span>€{Number(order.totalPrice).toFixed(2)}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to={ROUTES.shop}>{t('orderConfirmation.orderAgain')}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to={ROUTES.appDashboard}>{t('orderConfirmation.backToDashboard')}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="rounded-3xl bg-[#f3f1ea] p-6">
        <div className="grid gap-4 sm:grid-cols-5">
          {statuses.map((status, index) => (
            <div key={status} className="space-y-2 text-center">
              <div
                className={`mx-auto grid size-9 place-items-center rounded-full text-xs font-semibold ${
                  index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {index + 1}
              </div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{statusLabelByCode[status]}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
