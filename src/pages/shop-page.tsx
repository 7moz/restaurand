import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, History, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { menuApi, resolveBackendUrl } from '../api'
import { useAuth } from '../context/auth-context'
import { Link } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Spinner } from '../components/ui/spinner'
import { ROUTES } from '../constants/routes'
import { useCart } from '../context/cart-context'
import { prefetchRoute } from '../lib/route-prefetch'
import { useLanguage } from '../context/language-context'

export function ShopPage() {
  const { token } = useAuth()
  const { items, decreaseItem, removeItem, setQuantity, clearCart } = useCart()
  const { t } = useLanguage()

  const menusQuery = useQuery({
    queryKey: ['shop-menus'],
    queryFn: async () => (await menuApi.getAllMenus(token)).data,
  })

  const menuNameById = useMemo(() => {
    const mapping = new Map<number, string>()
    for (const menu of menusQuery.data ?? []) {
      mapping.set(menu.id, menu.name)
    }
    return mapping
  }, [menusQuery.data])

  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)

  if (menusQuery.isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (menusQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('shopPage.unableToLoadShopData')}</AlertTitle>
        <AlertDescription>
          {menusQuery.error instanceof Error
            ? menusQuery.error.message
            : t('shopPage.unexpectedErrorLoadingShopData')}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[#efede6] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t('shopPage.curatedCart')}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl leading-tight text-[#2d281f] sm:text-5xl">{t('shopPage.yourSelection')}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {t('shopPage.reviewDescription')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link
                to={ROUTES.orderHistory}
                onMouseEnter={() => prefetchRoute(ROUTES.orderHistory)}
                onFocus={() => prefetchRoute(ROUTES.orderHistory)}
                onTouchStart={() => prefetchRoute(ROUTES.orderHistory)}
              >
                <History className="size-4" />
                {t('shopPage.orderHistory')}
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link
                to={ROUTES.menu}
                onMouseEnter={() => prefetchRoute(ROUTES.menu)}
                onFocus={() => prefetchRoute(ROUTES.menu)}
                onTouchStart={() => prefetchRoute(ROUTES.menu)}
              >
                <ArrowLeft className="size-4" />
                {t('shopPage.backToMenu')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.6fr_0.9fr]">
        <section className="space-y-3">
          {items.length === 0 ? (
            <Card className="border-border/60 bg-card/85">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                {t('shopPage.emptyState')}
              </CardContent>
            </Card>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="group grid gap-4 rounded-2xl border border-border/40 bg-[#f8f6ef] p-4 transition-colors hover:bg-[#f1eee4] sm:grid-cols-[140px_1fr]"
              >
                <div className="h-28 overflow-hidden rounded-xl bg-muted sm:h-32">
                  {item.imageUrl ? (
                    <img
                      src={resolveBackendUrl(item.imageUrl) ?? undefined}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#d9cfb7] to-[#f1e8d4]" />
                  )}
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                      {menuNameById.get(item.menuId) ?? t('shopPage.foodFallback')}
                    </span>
                    <h3 className="font-serif text-xl text-[#332c22]">{item.name}</h3>
                    {item.description ? <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p> : null}
                    <p className="text-sm font-semibold text-primary">€{Number(item.price).toFixed(2)} {t('shopPage.each')}</p>
                  </div>

                  <div className="flex items-center justify-between gap-6 sm:justify-end">
                    <div className="flex items-center rounded-full bg-secondary/60 px-2 py-1">
                      <Button type="button" size="icon" variant="ghost" className="size-8" onClick={() => decreaseItem(item.id)}>
                        <Minus className="size-4" />
                      </Button>
                      <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={() => setQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-lg text-[#2d281f]">€{(Number(item.price) * item.quantity).toFixed(2)}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto p-0 text-[11px] uppercase tracking-[0.08em] text-red-600 hover:text-red-700"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="mr-1 size-3.5" />
                        {t('shopPage.remove')}
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}

          <Card className="border-border/50 bg-[#f3f0e7]">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{t('shopPage.sommelierNote')}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('shopPage.sommelierDescription')}
                </p>
              </div>
              <Button type="button" variant="outline">{t('shopPage.addPairingSuggestion')}</Button>
            </CardContent>
          </Card>
        </section>

        <aside className="h-fit rounded-2xl border border-border/50 bg-card/90 p-5 xl:sticky xl:top-24">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="inline-flex items-center gap-2 text-xl font-serif">
              <ShoppingBag className="size-5 text-primary" />
              {t('shopPage.summary')}
            </CardTitle>
            <CardDescription>{t('shopPage.itemsSelected', { count: String(items.length) })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-0">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('shopPage.noItemsSelectedYet')}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3">
                    <span className="line-clamp-1 max-w-[70%]">{item.name} x {item.quantity}</span>
                    <span className="font-medium">€{(Number(item.price) * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-1 border-t border-border pt-3 text-sm">
              <p className="flex items-center justify-between text-muted-foreground">
                <span>{t('shopPage.subtotal')}</span>
                <span>€{total.toFixed(2)}</span>
              </p>
              <p className="flex items-center justify-between text-muted-foreground">
                <span>{t('shopPage.service')}</span>
                <span>€{(items.length > 0 ? 4.5 : 0).toFixed(2)}</span>
              </p>
              <p className="flex items-center justify-between font-semibold text-foreground">
                <span>{t('shopPage.total')}</span>
                <span>€{(total + (items.length > 0 ? 4.5 : 0)).toFixed(2)}</span>
              </p>
            </div>

            <Button type="button" variant="outline" className="w-full" onClick={clearCart} disabled={items.length === 0}>
              {t('shopPage.clearCart')}
            </Button>
            <Button type="button" className="w-full" disabled={items.length === 0} asChild={items.length > 0}>
              {items.length > 0 ? (
                <Link
                  to={ROUTES.checkout}
                  onMouseEnter={() => prefetchRoute(ROUTES.checkout)}
                  onFocus={() => prefetchRoute(ROUTES.checkout)}
                  onTouchStart={() => prefetchRoute(ROUTES.checkout)}
                >
                  {t('shopPage.proceedToCheckout')}
                </Link>
              ) : (
                <span>{t('shopPage.proceedToCheckout')}</span>
              )}
            </Button>
          </CardContent>
        </aside>
      </div>
    </div>
  )
}
