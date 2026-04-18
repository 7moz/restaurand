import { useMemo, useState } from 'react'
import axios from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Mail, MailCheck, MailWarning, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { reclamationApi } from '../api'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Spinner } from '../components/ui/spinner'
import { ROUTES } from '../constants/routes'
import { useAuth } from '../context/auth-context'
import { useLanguage } from '../context/language-context'
import type { ReclamationResponseDTO } from '../types/dashboard'

function normalizeError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = typeof error.response?.data?.message === 'string' ? error.response.data.message : error.message
    return `HTTP ${error.response?.status ?? 'ERR'}: ${message}`
  }

  return error instanceof Error ? error.message : 'Unexpected error'
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

export function AdminReclamationsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { token, logout } = useAuth()
  const { t } = useLanguage()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const handleUnauthorized = async () => {
    await logout()
    navigate(ROUTES.login, { replace: true, state: { from: ROUTES.reclamations } })
  }

  const listQuery = useQuery({
    queryKey: ['admin-reclamations'],
    queryFn: async () => (await reclamationApi.getAllAdmin(token)).data,
    retry: false,
  })

  const detailsQuery = useQuery({
    queryKey: ['admin-reclamation-details', selectedId],
    enabled: selectedId !== null,
    queryFn: async () => {
      const id = selectedId as number
      return (await reclamationApi.getByIdAdmin(id, token)).data
    },
    retry: false,
  })

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => (await reclamationApi.markReadAdmin(id, token)).data,
    onSuccess: (updated) => {
      queryClient.setQueryData<ReclamationResponseDTO[]>(['admin-reclamations'], (previous) => {
        if (!previous) {
          return previous
        }
        return previous.map((item) => (item.id === updated.id ? updated : item))
      })

      queryClient.setQueryData<ReclamationResponseDTO>(['admin-reclamation-details', updated.id], updated)
    },
  })

  if (listQuery.error && axios.isAxiosError(listQuery.error)) {
    const status = listQuery.error.response?.status
    if (status === 401 || status === 403) {
      void handleUnauthorized()
    }
  }

  if (detailsQuery.error && axios.isAxiosError(detailsQuery.error)) {
    const status = detailsQuery.error.response?.status
    if (status === 401 || status === 403) {
      void handleUnauthorized()
    }
  }

  const reclamations = listQuery.data ?? []

  const counts = useMemo(() => {
    const open = reclamations.filter((item) => item.status === 'OPEN').length
    const read = reclamations.filter((item) => item.status === 'READ').length
    return { open, read }
  }, [reclamations])

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    if (!term) {
      return reclamations
    }

    return reclamations.filter((item) => {
      return (
        item.fullName.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term) ||
        item.subject.toLowerCase().includes(term) ||
        item.message.toLowerCase().includes(term) ||
        (item.phone?.toLowerCase().includes(term) ?? false) ||
        String(item.id).includes(term)
      )
    })
  }, [reclamations, searchTerm])

  const selected = detailsQuery.data ?? reclamations.find((item) => item.id === selectedId) ?? null

  const markRead = async (id: number) => {
    try {
      await markReadMutation.mutateAsync(id)
    } catch (error) {
      if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        await handleUnauthorized()
      }
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/40 bg-[#f6f4ee] shadow-sm">
        <CardHeader className="space-y-3 border-b border-border/50 bg-background/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-3xl">{t('adminReclamations.title')}</CardTitle>
              <CardDescription className="mt-2">{t('adminReclamations.description')}</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => void listQuery.refetch()}
              disabled={listQuery.isRefetching}
            >
              <RefreshCw className={`size-4 ${listQuery.isRefetching ? 'animate-spin' : ''}`} />
              {t('adminReclamations.refresh')}
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t('adminReclamations.openCount')}</p>
              <p className="mt-1 text-2xl font-semibold">{counts.open}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t('adminReclamations.readCount')}</p>
              <p className="mt-1 text-2xl font-semibold">{counts.read}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t('adminReclamations.searchLabel')}</label>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-input bg-input px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                placeholder={t('adminReclamations.searchPlaceholder')}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 p-4 md:grid-cols-[1.1fr_1fr]">
          <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t('adminReclamations.listTitle')}</p>

            {listQuery.isLoading ? (
              <div className="flex min-h-44 items-center justify-center">
                <Spinner className="size-7 text-primary" />
              </div>
            ) : listQuery.isError ? (
              <Alert variant="destructive">
                <AlertTitle>{t('adminReclamations.loadFailed')}</AlertTitle>
                <AlertDescription>{normalizeError(listQuery.error)}</AlertDescription>
              </Alert>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-card p-6 text-center text-sm text-muted-foreground">
                {t('adminReclamations.emptyState')}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((item) => {
                  const isSelected = selectedId === item.id
                  const isOpen = item.status === 'OPEN'

                  return (
                    <article
                      key={item.id}
                      className={`rounded-xl border p-3 transition-colors ${
                        isSelected ? 'border-primary/60 bg-primary/5' : 'border-border/60 bg-card'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">#{item.id} • {item.fullName}</p>
                          <p className="text-xs text-muted-foreground">{item.email}</p>
                          {item.phone && <p className="text-xs text-muted-foreground">{item.phone}</p>}
                          <p className="mt-1 line-clamp-1 text-sm">{item.subject}</p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                            isOpen ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isOpen ? <MailWarning className="size-3" /> : <MailCheck className="size-3" />}
                          {isOpen ? t('adminReclamations.statusOpen') : t('adminReclamations.statusRead')}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => setSelectedId(item.id)}>
                          {t('adminReclamations.viewDetails')}
                        </Button>
                        {isOpen ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => void markRead(item.id)}
                            disabled={markReadMutation.isPending}
                          >
                            {t('adminReclamations.markRead')}
                          </Button>
                        ) : null}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t('adminReclamations.detailsTitle')}</p>

            {!selected ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-card p-6 text-center text-sm text-muted-foreground">
                {t('adminReclamations.detailsPlaceholder')}
              </div>
            ) : (
              <article className="rounded-xl border border-border/60 bg-card p-4">
                <p className="text-sm font-semibold">#{selected.id} • {selected.fullName}</p>
                <p className="mt-1 text-xs text-muted-foreground">{selected.email}</p>
                {selected.phone && <p className="text-xs text-muted-foreground">{selected.phone}</p>}

                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    <span className="font-medium">{t('adminReclamations.createdAt')}:</span> {formatDateTime(selected.createdAt)}
                  </p>
                  <p>
                    <span className="font-medium">{t('adminReclamations.subject')}:</span> {selected.subject}
                  </p>
                  <p className="whitespace-pre-wrap rounded-lg bg-muted/40 p-3 leading-relaxed">
                    <span className="font-medium">{t('adminReclamations.message')}:</span>{' '}
                    {selected.message}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {selected.status === 'OPEN' ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="gap-2"
                      onClick={() => void markRead(selected.id)}
                      disabled={markReadMutation.isPending}
                    >
                      <MailCheck className="size-4" />
                      {t('adminReclamations.markRead')}
                    </Button>
                  ) : null}
                  <Button asChild type="button" variant="outline" className="gap-2">
                    <a
                      href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Mail className="size-4" />
                      {t('adminReclamations.replyEmail')}
                    </a>
                  </Button>
                </div>
              </article>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
