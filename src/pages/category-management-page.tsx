import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit2, Trash2, Plus, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useAuth } from '../context/auth-context'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'
import { Alert, AlertDescription } from '../components/ui/alert'
import { api } from '../api'
import { useLanguage } from '../context/language-context'

interface Category {
  id: number
  name: string
  description?: string
  icon?: string
}

export function CategoryManagementPage() {
  const { role } = useAuth()
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [error, setError] = useState('')

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/api/menus')
      return response.data || []
    },
  })

  // Create/Update category
  const upsertMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      if (editingId) {
        return api.put(`/api/menus/${editingId}`, data)
      } else {
        return api.post('/api/menus', data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setFormData({ name: '', description: '' })
      setEditingId(null)
      setShowForm(false)
      setError('')
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || t('categoryManagement.failedToSave'))
    },
  })

  // Delete category
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/api/menus/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || t('categoryManagement.failedToDelete'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError(t('categoryManagement.categoryNameRequired'))
      return
    }
    upsertMutation.mutate(formData)
  }

  const handleEdit = (category: Category) => {
    setFormData({ name: category.name, description: category.description || '' })
    setEditingId(category.id)
    setShowForm(true)
    setError('')
  }

  const handleCancel = () => {
    setFormData({ name: '', description: '' })
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  if (role === 'ADMIN') {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-[#f3f1ea] p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t('categoryManagement.eyebrow')}</p>
              <h1 className="mt-2 font-serif text-4xl text-[#2f2a21] sm:text-5xl">{t('categoryManagement.title')}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t('categoryManagement.description')}</p>
            </div>
            <div className="w-full sm:w-72">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-10 w-full rounded-full border border-border/60 bg-card pl-9 pr-4 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50"
                  placeholder={t('categoryManagement.searchPlaceholder')}
                />
              </div>
            </div>
          </div>
          {!showForm ? (
            <Button
              onClick={() => {
                setFormData({ name: '', description: '' })
                setEditingId(null)
                setShowForm(true)
                setError('')
              }}
              className="mt-5 gap-2"
            >
              <Plus className="size-4" />
              {t('categoryManagement.createCategory')}
            </Button>
          ) : null}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showForm && (
          <Card className="border-border/40 bg-[#f7f5ee] p-6">
            <h2 className="mb-4 text-2xl">
              {editingId ? t('categoryManagement.editCategory') : t('categoryManagement.createNewCategory')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t('categoryManagement.categoryName')}</label>
                <Input
                  placeholder={t('categoryManagement.categoryNamePlaceholder')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t('categoryManagement.descriptionLabel')}</label>
                <Input
                  placeholder={t('categoryManagement.optionalDescription')}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending ? t('categoryManagement.saving') : t('categoryManagement.save')}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  {t('categoryManagement.cancel')}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">{t('categoryManagement.loadingCategories')}</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">{t('categoryManagement.noCategoriesFound')}</div>
        ) : (
          <Card className="overflow-hidden border-border/40 bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#ece8dd] border-b border-border/60">
                  <tr>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t('categoryManagement.tableCategoryName')}</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t('categoryManagement.tableDescription')}</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t('categoryManagement.tableStatus')}</th>
                    <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t('categoryManagement.tableActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category: Category, index: number) => (
                    <tr key={category.id} className={`border-b border-border/30 transition-colors hover:bg-[#f5f2e9] ${index % 2 === 1 ? 'bg-[#faf8f3]' : ''}`}>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{category.name}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                        {category.description || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                          {t('categoryManagement.enabled')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(category)}
                            className="gap-1 rounded-full"
                          >
                            <Edit2 className="size-4" />
                            {t('categoryManagement.edit')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(category.id)}
                            disabled={deleteMutation.isPending}
                            className="gap-1 rounded-full text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="size-4" />
                            {t('categoryManagement.delete')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    )
  }

  // User view - Horizontal draggable navbar
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[#f3f1ea] p-6 sm:p-8">
        <h1 className="text-4xl sm:text-5xl">{t('categoryManagement.browseCategories')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('categoryManagement.browseDescription')}</p>
      </div>

      <HorizontalCategoryScroll categories={categories} isLoading={isLoading} emptyMessage={t('categoryManagement.noCategoriesAvailable')} loadingMessage={t('categoryManagement.loadingCategories')} />
    </div>
  )
}

function HorizontalCategoryScroll({
  categories,
  isLoading,
  emptyMessage,
  loadingMessage,
}: {
  categories: Category[]
  isLoading: boolean
  emptyMessage: string
  loadingMessage: string
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [categories])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
      setTimeout(checkScroll, 300)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">{loadingMessage}</div>
  }

  if (categories.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>
  }

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-primary text-primary-foreground p-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}

      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-4 py-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        {categories.map((category: Category) => (
          <div
            key={category.id}
            className="flex-shrink-0 w-52 rounded-2xl border border-border/40 bg-[#f7f5ee] p-4 hover:shadow-md hover:border-primary/50 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-center mb-3 h-12 bg-primary/10 rounded">
              <span className="text-2xl">🍽️</span>
            </div>
            <h3 className="font-semibold text-foreground text-center">{category.name}</h3>
            {category.description && (
              <p className="text-xs text-muted-foreground text-center mt-2 line-clamp-2">{category.description}</p>
            )}
          </div>
        ))}
      </div>

      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-primary text-primary-foreground p-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        >
          <ChevronRight className="size-5" />
        </button>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
