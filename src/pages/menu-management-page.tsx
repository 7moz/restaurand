import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Filter, Grid3X3, List, Move, Pencil, PlusCircle, Search, ToggleLeft, ToggleRight, X, ZoomIn, ZoomOut } from 'lucide-react'
import { foodApi, menuApi, resolveBackendUrl } from '../api'
import { useAuth } from '../context/auth-context'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Spinner } from '../components/ui/spinner'
import { useLanguage } from '../context/language-context'

const initialForm = {
  menuId: '',
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  enabled: true,
}

export function MenuManagementPage() {
  const { token } = useAuth()
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [selectedMenuFilter, setSelectedMenuFilter] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null)
  const [cropZoom, setCropZoom] = useState(1)
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 })
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)
  const [editorSize, setEditorSize] = useState({ width: 0, height: 0 })
  const [error, setError] = useState('')
  const [isArchivedOpen, setIsArchivedOpen] = useState(false)
  const [blockedDeleteFood, setBlockedDeleteFood] = useState<{ id: number; name: string } | null>(null)
  const [blockedDeleteMessage, setBlockedDeleteMessage] = useState('')
  const editorFrameRef = useRef<HTMLDivElement | null>(null)

  const menusQuery = useQuery({
    queryKey: ['admin-menus'],
    queryFn: async () => (await menuApi.getAllMenus(token)).data,
  })

  const foodsQuery = useQuery({
    queryKey: ['admin-foods'],
    queryFn: async () => (await foodApi.getAllFoods(token)).data,
  })

  const menuOptions = menusQuery.data ?? []

  useEffect(() => {
    if (selectedMenuFilter !== 'All' && !menuOptions.some((menu) => String(menu.id) === selectedMenuFilter)) {
      setSelectedMenuFilter('All')
    }
  }, [menuOptions, selectedMenuFilter])

  useEffect(() => {
    if (!form.menuId && menuOptions.length) {
      setForm((prev) => ({ ...prev, menuId: String(menuOptions[0].id) }))
    }
  }, [form.menuId, menuOptions])

  const menuNameById = useMemo(() => {
    const mapping = new Map<number, string>()
    for (const menu of menuOptions) {
      mapping.set(menu.id, menu.name)
    }
    return mapping
  }, [menuOptions])

  const clampCropOffset = (offset: { x: number; y: number }, zoom: number, size: { width: number; height: number }) => {
    if (!size.width || !size.height) {
      return { x: 0, y: 0 }
    }

    const maxX = ((zoom - 1) * size.width) / 2
    const maxY = ((zoom - 1) * size.height) / 2

    return {
      x: Math.max(-maxX, Math.min(maxX, offset.x)),
      y: Math.max(-maxY, Math.min(maxY, offset.y)),
    }
  }

  useEffect(() => {
    if (!selectedImageFile) {
      setSelectedImagePreview(null)
      return
    }

    const previewUrl = URL.createObjectURL(selectedImageFile)
    setSelectedImagePreview(previewUrl)

    return () => URL.revokeObjectURL(previewUrl)
  }, [selectedImageFile])

  useEffect(() => {
    setCropZoom(1)
    setCropOffset({ x: 0, y: 0 })
    setDragPosition(null)
  }, [selectedImageFile])

  useEffect(() => {
    if (!editorFrameRef.current) {
      return
    }

    const element = editorFrameRef.current
    const updateSize = () => {
      setEditorSize({
        width: element.clientWidth,
        height: element.clientHeight,
      })
    }

    updateSize()

    const observer = new ResizeObserver(updateSize)
    observer.observe(element)

    return () => observer.disconnect()
  }, [selectedImageFile, isCreateOpen, isUpdateOpen])

  useEffect(() => {
    setCropOffset((previous) => clampCropOffset(previous, cropZoom, editorSize))
  }, [cropZoom, editorSize])

  useEffect(() => {
    const stopDragging = () => setDragPosition(null)
    window.addEventListener('mouseup', stopDragging)

    return () => window.removeEventListener('mouseup', stopDragging)
  }, [])

  const createAdjustedImageFile = async (file: File) => {
    const frameWidth = editorSize.width || 960
    const frameHeight = editorSize.height || 540
    const outputWidth = 1200
    const outputHeight = Math.round((frameHeight / frameWidth) * outputWidth)

    const fileUrl = URL.createObjectURL(file)

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const nextImage = new Image()
        nextImage.onload = () => resolve(nextImage)
        nextImage.onerror = () => reject(new Error(t('menuManagement.invalidImageRead')))
        nextImage.src = fileUrl
      })

      const canvas = document.createElement('canvas')
      canvas.width = outputWidth
      canvas.height = outputHeight

      const context = canvas.getContext('2d')
      if (!context) {
        return file
      }

      const baseScale = Math.max(frameWidth / image.naturalWidth, frameHeight / image.naturalHeight)
      const drawWidth = image.naturalWidth * baseScale * cropZoom
      const drawHeight = image.naturalHeight * baseScale * cropZoom
      const safeOffset = clampCropOffset(cropOffset, cropZoom, { width: frameWidth, height: frameHeight })
      const drawX = (frameWidth - drawWidth) / 2 + safeOffset.x
      const drawY = (frameHeight - drawHeight) / 2 + safeOffset.y
      const scaleX = outputWidth / frameWidth
      const scaleY = outputHeight / frameHeight

      context.drawImage(image, drawX * scaleX, drawY * scaleY, drawWidth * scaleX, drawHeight * scaleY)

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.92)
      })

      if (!blob) {
        return file
      }

      const baseName = file.name.replace(/\.[^.]+$/, '') || 'food-image'
      return new File([blob], `${baseName}-framed.jpg`, { type: 'image/jpeg' })
    } finally {
      URL.revokeObjectURL(fileUrl)
    }
  }

  const refetchFoods = () => queryClient.invalidateQueries({ queryKey: ['admin-foods'] })

  const createMutation = useMutation({
    mutationFn: async (payload: {
      menuId: number
      name: string
      description: string
      price: number
      imageUrl?: string | null
      enabled?: boolean
    }) => foodApi.createFood(payload, token),
    onSuccess: async () => {
      setIsCreateOpen(false)
      setForm(initialForm)
      setSelectedImageFile(null)
      await refetchFoods()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (variables: {
      id: number
      payload: {
        menuId: number
        name: string
        description: string
        price: number
        imageUrl?: string | null
        enabled?: boolean
      }
    }) => foodApi.updateFood(variables.id, variables.payload, token),
    onSuccess: async () => {
      setIsUpdateOpen(false)
      setEditingId(null)
      setForm(initialForm)
      setSelectedImageFile(null)
      await refetchFoods()
    },
  })

  const toggleEnabledMutation = useMutation({
    mutationFn: async (variables: { id: number; enabled: boolean }) => foodApi.setFoodEnabled(variables.id, variables.enabled, token),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['admin-foods'] })
      const previousFoods = queryClient.getQueryData<Array<Record<string, unknown>>>(['admin-foods'])

      queryClient.setQueryData<Array<Record<string, unknown>>>(['admin-foods'], (currentFoods) =>
        (currentFoods ?? []).map((food) =>
          food.id === variables.id ? { ...food, enabled: variables.enabled } : food,
        ),
      )

      return { previousFoods }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousFoods) {
        queryClient.setQueryData(['admin-foods'], context.previousFoods)
      }
      queryClient.invalidateQueries({ queryKey: ['admin-foods'] })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-foods'] })
    },
  })

  const closeCreateModal = () => {
    setIsCreateOpen(false)
    setError('')
    setForm(initialForm)
    setSelectedImageFile(null)
    setCropZoom(1)
    setCropOffset({ x: 0, y: 0 })
  }

  const closeUpdateModal = () => {
    setIsUpdateOpen(false)
    setEditingId(null)
    setError('')
    setForm(initialForm)
    setSelectedImageFile(null)
    setCropZoom(1)
    setCropOffset({ x: 0, y: 0 })
  }

  const closeBlockedDeletePopup = () => {
    setBlockedDeleteFood(null)
    setBlockedDeleteMessage('')
  }

  const handleDisableBlockedFood = async () => {
    if (!blockedDeleteFood) {
      return
    }

    try {
      await toggleEnabledMutation.mutateAsync({ id: blockedDeleteFood.id, enabled: false })
      setBlockedDeleteFood(null)
      setBlockedDeleteMessage('')
    } catch (disableError) {
      setError(disableError instanceof Error ? disableError.message : t('menuManagement.foodRequestFailed'))
    }
  }



  const submitFood = async (mode: 'create' | 'update') => {
    setError('')

    if (!form.name || !form.price || !form.menuId) {
      setError(t('menuManagement.namePriceMenuRequired'))
      return
    }

    if (mode === 'update' && !editingId) {
      setError(t('menuManagement.selectFoodToUpdate'))
      return
    }

    try {
      let imageUrl = form.imageUrl.trim() || null

      if (selectedImageFile) {
        const adjustedImageFile = await createAdjustedImageFile(selectedImageFile)
        const uploadResponse = await foodApi.uploadMenuImage(adjustedImageFile, token)
        imageUrl = uploadResponse.data.url
        setForm((prev) => ({ ...prev, imageUrl: imageUrl ?? '' }))
        setSelectedImageFile(null)
      }

      const payload = {
        menuId: Number(form.menuId),
        name: form.name,
        description: form.description,
        price: Number(form.price),
        imageUrl,
        enabled: form.enabled,
      }

      if (mode === 'update' && editingId) {
        await updateMutation.mutateAsync({ id: editingId, payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('menuManagement.foodRequestFailed'))
    }
  }

  const handleCreateSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await submitFood('create')
  }

  const handleUpdateSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await submitFood('update')
  }

  const renderFoodFormFields = () => (
    <>
      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('menuManagement.menuCategory')}</label>
        <select
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={form.menuId}
          onChange={(event) => setForm((prev) => ({ ...prev, menuId: event.target.value }))}
        >
          <option value="">{t('menuManagement.selectMenu')}</option>
          {menuOptions.map((menu) => (
            <option key={menu.id} value={menu.id}>{menu.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('menuManagement.foodName')}</label>
        <Input placeholder={t('menuManagement.foodName')} value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('menuManagement.description')}</label>
        <Input
          placeholder={t('menuManagement.description')}
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('menuManagement.price')}</label>
        <Input placeholder={t('menuManagement.price')} value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('menuManagement.imageUrl')}</label>
        <Input
          placeholder={t('menuManagement.imageUrl')}
          value={form.imageUrl}
          onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
        />
        <p className="text-xs text-muted-foreground">{t('menuManagement.imageHelper')}</p>
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('menuManagement.uploadImage')}</label>
        <Input
          type="file"
          accept="image/*"
          onChange={(event) => setSelectedImageFile(event.target.files?.[0] ?? null)}
        />
        <p className="text-xs text-muted-foreground">
          {selectedImageFile ? t('menuManagement.selectedFile', { name: selectedImageFile.name }) : t('menuManagement.fileSupport')}
        </p>
      </div>
      <div className="md:col-span-2">
        <div className="overflow-hidden rounded-2xl border border-border bg-muted/60">
          {selectedImagePreview ? (
            <div className="space-y-3 p-3">
              <div
                ref={editorFrameRef}
                className="relative h-72 w-full cursor-move overflow-hidden rounded-xl bg-black/70"
                onMouseDown={(event) => setDragPosition({ x: event.clientX, y: event.clientY })}
                onMouseMove={(event) => {
                  if (!dragPosition) {
                    return
                  }

                  const deltaX = event.clientX - dragPosition.x
                  const deltaY = event.clientY - dragPosition.y
                  setDragPosition({ x: event.clientX, y: event.clientY })
                  setCropOffset((previous) =>
                    clampCropOffset({ x: previous.x + deltaX, y: previous.y + deltaY }, cropZoom, editorSize),
                  )
                }}
                onMouseLeave={() => setDragPosition(null)}
              >
                <img
                  src={selectedImagePreview}
                  alt={t('menuManagement.cropPreviewAlt')}
                  className="h-full w-full select-none object-contain"
                  draggable={false}
                  style={{ transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropZoom})` }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1">
                  <Move className="size-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{t('menuManagement.dragToPosition')}</span>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setCropZoom((previous) => Math.max(1, Number((previous - 0.1).toFixed(2))))}
                >
                  <ZoomOut className="size-4" />
                  {t('menuManagement.zoomOut')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setCropZoom((previous) => Math.min(3, Number((previous + 0.1).toFixed(2))))}
                >
                  <ZoomIn className="size-4" />
                  {t('menuManagement.zoomIn')}
                </Button>
                <Input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={cropZoom}
                  onChange={(event) => setCropZoom(Number(event.target.value))}
                  className="w-40"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCropZoom(1)
                    setCropOffset({ x: 0, y: 0 })
                  }}
                >
                  {t('menuManagement.reset')}
                </Button>
              </div>
            </div>
          ) : form.imageUrl ? (
            <img
              src={resolveBackendUrl(form.imageUrl) ?? undefined}
              alt={t('menuManagement.previewAlt')}
              className="h-64 w-full object-contain bg-muted/40"
            />
          ) : (
            <div className="flex h-64 items-center justify-center px-4 text-sm text-muted-foreground">
              {t('menuManagement.previewHint')}
            </div>
          )}
        </div>
      </div>
    </>
  )

  const foods = foodsQuery.data ?? []
  const filteredFoods = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return foods.filter((food) => {
      if (food.enabled === false) {
        return false
      }
      
      const matchesMenu = selectedMenuFilter === 'All' || food.menuId === Number(selectedMenuFilter)
      if (!matchesMenu) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return `${food.name} ${food.description ?? ''}`.toLowerCase().includes(normalizedSearch)
    })
  }, [foods, searchTerm, selectedMenuFilter])

  const archivedFoods = useMemo(() => {
    return foods.filter((food) => food.enabled === false)
  }, [foods])

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-[#f3f1ea] p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl text-[#2f2a21] sm:text-5xl">{t('menuManagement.title')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('menuManagement.subtitle')}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t('menuManagement.activeItems', { count: String(filteredFoods.length) })}
          </div>
        </div>
      </section>

      <Card className="border-border/40 bg-card">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => {
                setError('')
                setEditingId(null)
                setForm((prev) => ({ ...initialForm, menuId: prev.menuId || (menuOptions[0] ? String(menuOptions[0].id) : '') }))
                setSelectedImageFile(null)
                setIsCreateOpen(true)
              }}
            >
              <PlusCircle className="size-4" />
              {t('menuManagement.createFood')}
            </Button>

            <div className="relative">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsFilterOpen((previous) => !previous)}
                className="gap-2"
                aria-label={t('menuManagement.openCategoryFilter')}
              >
                <Filter className="size-4" />
                {t('menuManagement.filter')}
              </Button>

              {isFilterOpen ? (
                <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-border/60 bg-card shadow-lg">
                  <div className="max-h-80 overflow-y-auto p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMenuFilter('All')
                        setIsFilterOpen(false)
                      }}
                      className="w-full rounded px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-secondary"
                    >
                      {t('menuManagement.allMenus')}
                    </button>
                    <div className="my-1 border-t border-border" />
                    {menuOptions.map((menu) => (
                      <button
                        key={menu.id}
                        type="button"
                        onClick={() => {
                          setSelectedMenuFilter(String(menu.id))
                          setIsFilterOpen(false)
                        }}
                        className="w-full rounded px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                      >
                        {menu.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {archivedFoods.length > 0 && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsArchivedOpen(true)}
                className="gap-2"
              >
                {t('menuManagement.viewArchived')}
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-bold">
                  {archivedFoods.length}
                </span>
              </Button>
            )}

            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-9 w-full rounded-full border border-border/60 bg-background pl-9 pr-4 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50"
                placeholder={t('menuManagement.searchPlaceholder')}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>

          <div className="inline-flex rounded-lg border border-border/60 bg-secondary p-1">
            <button
              type="button"
              className={`rounded-md p-1.5 transition ${viewMode === 'grid' ? 'bg-card text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              aria-label={t('menuManagement.gridView')}
              aria-pressed={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="size-4" />
            </button>
            <button
              type="button"
              className={`rounded-md p-1.5 transition ${viewMode === 'list' ? 'bg-card text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              aria-label={t('menuManagement.listView')}
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
            >
              <List className="size-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      {foodsQuery.isLoading || menusQuery.isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
          {filteredFoods.map((food) => (
            <Card
              key={food.id}
              className={`overflow-hidden border-border/40 bg-[#f7f5ee] transition ${
                viewMode === 'grid'
                  ? 'flex h-[332px] flex-col hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(0,0,0,0.10)]'
                  : 'flex flex-col sm:h-[220px] sm:flex-row'
              }`}
            >
              <div className={`relative shrink-0 overflow-hidden bg-muted/40 ${viewMode === 'grid' ? 'h-40' : 'h-40 sm:h-full sm:w-72'}`}>
                {food.imageUrl ? (
                  <img
                    src={resolveBackendUrl(food.imageUrl) ?? undefined}
                    alt={food.name}
                    className={`h-full w-full object-center transition-transform duration-500 ${viewMode === 'grid' ? 'object-cover hover:scale-105' : 'object-cover'}`}
                  />
                ) : (
                  <div className="h-full bg-gradient-to-br from-amber-200/70 via-orange-200/60 to-yellow-100/70" />
                )}
                <Button
                  type="button"
                  variant={food.enabled !== false ? 'default' : 'secondary'}
                  size="sm"
                  className="absolute right-3 top-3 z-10 h-7 gap-1 rounded-full px-2.5 text-xs shadow-md backdrop-blur"
                  onClick={() => toggleEnabledMutation.mutate({ id: food.id, enabled: !(food.enabled !== false) })}
                  disabled={toggleEnabledMutation.isPending}
                >
                  {food.enabled !== false ? <ToggleRight className="size-3.5" /> : <ToggleLeft className="size-3.5" />}
                  {food.enabled !== false ? t('menuManagement.on') : t('menuManagement.off')}
                </Button>
              </div>
              <CardContent className="flex flex-1 flex-col justify-between gap-2 p-3.5">
                <div className="space-y-1">
                  <div className="inline-flex rounded-full bg-secondary px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-secondary-foreground">
                    {menuNameById.get(food.menuId) ?? t('menuManagement.noMenu')}
                  </div>
                  <CardTitle className="line-clamp-1 font-serif text-xl leading-snug text-[#2f2a21]">{food.name}</CardTitle>
                  {food.description ? (
                    <p className={`text-xs leading-snug text-muted-foreground ${viewMode === 'grid' ? 'line-clamp-2' : 'line-clamp-3'}`}>
                      {food.description}
                    </p>
                  ) : null}
                  <div className="inline-flex rounded-lg bg-primary/10 px-2 py-1 text-sm font-semibold text-primary">
                    €{Number(food.price).toFixed(2)}
                  </div>
                </div>
                <div className={`flex gap-2 ${viewMode === 'list' ? 'sm:max-w-xs' : ''}`}>
                  <Button
                    variant="secondary"
                    className="h-8 flex-1 text-xs"
                    onClick={() => {
                      setEditingId(food.id)
                      setError('')
                      setForm({
                        menuId: String(food.menuId),
                        name: food.name,
                        description: food.description || '',
                        price: String(food.price),
                        imageUrl: food.imageUrl || '',
                        enabled: food.enabled !== false,
                      })
                      setSelectedImageFile(null)
                      setIsUpdateOpen(true)
                    }}
                  >
                    <Pencil className="size-3.5" />
                    {t('menuManagement.edit')}
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-8 flex-1 text-xs"
                    onClick={() => toggleEnabledMutation.mutate({ id: food.id, enabled: false })}
                    disabled={toggleEnabledMutation.isPending}
                  >
                    <ToggleLeft className="size-3.5" />
                    {t('menuManagement.archive')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border/60 bg-[#f7f5ee] p-5 shadow-2xl">
            <button
              aria-label={t('menuManagement.closeModal')}
              className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={closeCreateModal}
              type="button"
            >
              <X className="size-4" />
            </button>
            <h2 className="text-3xl">{t('menuManagement.createFoodTitle')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('menuManagement.createFoodDescription')}</p>
            {error ? (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>{t('menuManagement.actionFailed')}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <form onSubmit={handleCreateSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
              {renderFoodFormFields()}
              <div className="flex justify-end gap-2 md:col-span-2">
                <Button type="button" variant="ghost" onClick={closeCreateModal}>
                  {t('menuManagement.cancel')}
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  <PlusCircle className="size-4" />
                  {t('menuManagement.create')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isUpdateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border/60 bg-[#f7f5ee] p-5 shadow-2xl">
            <button
              aria-label={t('menuManagement.closeModal')}
              className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={closeUpdateModal}
              type="button"
            >
              <X className="size-4" />
            </button>
            <h2 className="text-3xl">{t('menuManagement.updateFoodTitle')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('menuManagement.updateFoodDescription')}</p>
            {error ? (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>{t('menuManagement.actionFailed')}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <form onSubmit={handleUpdateSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
              {renderFoodFormFields()}
              <div className="flex justify-end gap-2 md:col-span-2">
                <Button type="button" variant="ghost" onClick={closeUpdateModal}>
                  {t('menuManagement.cancel')}
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  <Pencil className="size-4" />
                  {t('menuManagement.update')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {blockedDeleteFood ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-border/60 bg-[#f7f5ee] p-5 shadow-2xl">
            <button
              aria-label="Close popup"
              className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={closeBlockedDeletePopup}
              type="button"
            >
              <X className="size-4" />
            </button>
            <h2 className="text-2xl text-[#2f2a21]">{t('menuManagement.deleteBlockedTitle')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {blockedDeleteMessage || t('menuManagement.deleteBlockedDescription', { name: blockedDeleteFood.name })}
            </p>
            <p className="mt-3 text-sm text-[#2f2a21]">{t('menuManagement.deleteBlockedSuggestion')}</p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" onClick={closeBlockedDeletePopup}>
                {t('menuManagement.keepItem')}
              </Button>
              <Button type="button" variant="secondary" onClick={handleDisableBlockedFood} disabled={toggleEnabledMutation.isPending}>
                {t('menuManagement.disableItem')}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isArchivedOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4">
          <div className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl border border-border/60 bg-[#f7f5ee] p-5 shadow-2xl">
            <button
              aria-label={t('menuManagement.closeModal')}
              className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => setIsArchivedOpen(false)}
              type="button"
            >
              <X className="size-4" />
            </button>
            <h2 className="text-2xl text-[#2f2a21]">{t('menuManagement.archivedItemsTitle')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('menuManagement.archivedItemsDescription')}</p>
            
            {archivedFoods.length === 0 ? (
              <div className="mt-6 rounded-lg border border-border/60 bg-background p-6 text-center">
                <p className="text-sm text-muted-foreground">{t('menuManagement.noArchivedItems')}</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {archivedFoods.map((food) => (
                  <div
                    key={food.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-background p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-[#2f2a21]">{food.name}</p>
                      {food.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{food.description}</p>
                      )}
                      <div className="mt-1 inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-secondary-foreground">
                        {menuNameById.get(food.menuId) ?? t('menuManagement.noMenu')}
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toggleEnabledMutation.mutate({ id: food.id, enabled: true })}
                      disabled={toggleEnabledMutation.isPending}
                      className="ml-3 flex-shrink-0"
                    >
                      <ToggleRight className="size-3.5 mr-1" />
                      {t('menuManagement.restoreItem')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
