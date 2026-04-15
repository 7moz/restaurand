import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/auth-context'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '../../api'

interface Category {
  id: number
  name: string
  description?: string
}

export function Header() {
  const { role } = useAuth()
  const categoryStripRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/api/menus')
      return response.data || []
    },
  })

  const updateScrollButtons = () => {
    const node = categoryStripRef.current
    if (!node) {
      setCanScrollLeft(false)
      setCanScrollRight(false)
      return
    }

    const maxScrollLeft = node.scrollWidth - node.clientWidth
    setCanScrollLeft(node.scrollLeft > 2)
    setCanScrollRight(node.scrollLeft < maxScrollLeft - 2)
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateScrollButtons)
    return () => window.cancelAnimationFrame(frame)
  }, [categories])

  useEffect(() => {
    const node = categoryStripRef.current
    if (!node) {
      return
    }

    const onScroll = () => updateScrollButtons()
    const resizeObserver = new ResizeObserver(onScroll)
    resizeObserver.observe(node)
    node.addEventListener('scroll', onScroll)
    window.addEventListener('resize', onScroll)

    return () => {
      resizeObserver.disconnect()
      node.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [categories])

  const scrollCategories = (direction: 'left' | 'right') => {
    const node = categoryStripRef.current
    if (!node) {
      return
    }

    const amount = Math.max(180, Math.floor(node.clientWidth * 0.5))
    node.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  if (role === 'ADMIN') {
    return null
  }

  return (
    <header className="hidden min-w-0 flex-col border-b border-border/70 bg-card/80 px-8 py-4 backdrop-blur lg:flex">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={() => scrollCategories('left')}
          disabled={!canScrollLeft}
          className="grid size-8 place-items-center rounded-full border border-border bg-background text-foreground transition disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Scroll categories left"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div
          ref={categoryStripRef}
          className="flex h-20 min-w-0 flex-1 items-start gap-4 overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((category: Category) => (
            <div
              key={category.id}
              className="flex w-20 flex-shrink-0 flex-col items-center gap-2 rounded-lg px-2 py-1"
              title={category.name}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold text-sm">
                {category.name.charAt(0).toUpperCase()}
              </div>
              <span className="line-clamp-2 text-center text-xs font-medium text-foreground">{category.name}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollCategories('right')}
          disabled={!canScrollRight}
          className="grid size-8 place-items-center rounded-full border border-border bg-background text-foreground transition disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Scroll categories right"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </header>
  )
}
