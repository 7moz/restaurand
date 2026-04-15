import { useMemo, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { ROUTES } from '../constants/routes'
import { useAuth } from '../context/auth-context'
import { useCart } from '../context/cart-context'
import { orderApi } from '../api'
import { useLanguage } from '../context/language-context'

function toApiPickupTime(value: string) {
  if (!value) {
    return ''
  }

  // datetime-local returns local wall-clock time (no timezone). Keep it as LocalDateTime.
  return value.length === 16 ? `${value}:00` : value
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, clearCart } = useCart()
  const { token, logout } = useAuth()
  const { t } = useLanguage()

  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0), [items])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (items.length === 0) {
      setError(t('checkout.cartEmptyError'))
      return
    }

    if (!pickupTime) {
      setError(t('checkout.pickupTimeRequired'))
      return
    }

    setError('')
    setSubmitting(true)

    try {
      if (!token) {
        navigate(ROUTES.login, { replace: true, state: { from: ROUTES.checkout } })
        return
      }

      const response = await orderApi.createOrder(
        {
          items: items.map((item) => ({ menuItemId: item.id, quantity: item.quantity })),
          phone: phone.trim(),
          note: note.trim() || undefined,
          pickupTime: toApiPickupTime(pickupTime),
        },
        token,
      )

      clearCart()
      navigate(ROUTES.orderConfirmation, {
        replace: true,
        state: { order: response.data },
      })
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        await logout()
        navigate(ROUTES.login, { replace: true, state: { from: ROUTES.checkout } })
        return
      }

      if (axios.isAxiosError(err)) {
        const validationErrors = err.response?.data?.validationErrors
        if (validationErrors && typeof validationErrors === 'object') {
          const firstError = Object.values(validationErrors).find((value) => typeof value === 'string') as
            | string
            | undefined
          if (firstError) {
            setError(firstError)
            return
          }
        }

        const message =
          typeof err.response?.data?.message === 'string'
            ? err.response.data.message
            : t('checkout.unableToPlaceOrder')
        setError(message)
      } else {
        setError(err instanceof Error ? err.message : t('checkout.unableToPlaceOrderNow'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[#f3f1ea] p-5 sm:p-8">
        <div className="mx-auto grid max-w-3xl grid-cols-3 items-center gap-3 text-center text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <div className="space-y-2">
            <span className="mx-auto grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">1</span>
            <p>{t('checkout.stepSelection')}</p>
          </div>
          <div className="space-y-2">
            <span className="mx-auto grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">2</span>
            <p>{t('checkout.stepCheckout')}</p>
          </div>
          <div className="space-y-2">
            <span className="mx-auto grid size-8 place-items-center rounded-full bg-secondary text-secondary-foreground">3</span>
            <p>{t('checkout.stepConfirmation')}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="border-border/40 bg-[#f6f4ee]">
          <CardHeader>
            <CardTitle className="text-3xl">{t('checkout.deliveryDetails')}</CardTitle>
            <CardDescription>{t('checkout.pickupOnly')}</CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>{t('checkout.orderFailed')}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t('checkout.phoneNumber')}</label>
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={t('checkout.phonePlaceholder')} required />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t('checkout.pickupTime')}</label>
                <Input
                  type="datetime-local"
                  value={pickupTime}
                  onChange={(event) => setPickupTime(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t('checkout.noteOptional')}</label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={4}
                  placeholder={t('checkout.notePlaceholder')}
                  className="w-full resize-y rounded-xl border border-input bg-input px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="button" variant="outline" asChild>
                  <Link to={ROUTES.shop}>{t('checkout.backToCart')}</Link>
                </Button>
                <Button type="submit" disabled={submitting || items.length === 0}>
                  {submitting ? t('checkout.confirming') : t('checkout.confirmOrder')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <aside className="h-fit rounded-2xl border border-border/40 bg-card p-4">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-2xl">{t('checkout.orderSummary')}</CardTitle>
            <CardDescription>{t('checkout.itemsSelected', { count: String(items.length) })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-0">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('checkout.cartEmpty')}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3">
                    <span className="line-clamp-1 max-w-[70%]">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="font-medium">€{(Number(item.price) * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-border pt-3">
              <p className="flex items-center justify-between text-sm font-semibold">
                <span>{t('checkout.total')}</span>
                <span>€{total.toFixed(2)}</span>
              </p>
            </div>
            <div className="space-y-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
              <p className="flex items-center justify-between">
                <span>{t('checkout.service')}</span>
                <span>{t('checkout.included')}</span>
              </p>
              <p className="flex items-center justify-between">
                <span>{t('checkout.deliveryFee')}</span>
                <span>{t('checkout.freeAmount')}</span>
              </p>
            </div>
            <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
              {t('checkout.helperText')}
            </p>
          </CardContent>
        </aside>
      </div>
    </div>
  )
}
