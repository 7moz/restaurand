import { type ReactNode, useEffect } from 'react'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { cn } from '../../lib/utils'

type ToastTone = 'success' | 'warning' | 'error' | 'info'

type ToastProps = {
  open: boolean
  noticeId?: number
  tone: ToastTone
  title: string
  summary: string
  addedCount?: number
  skippedCount?: number
  durationMs?: number
  onClose: () => void
}

const toneStyle: Record<
  ToastTone,
  {
    shell: string
    iconWrap: string
    stat: string
    icon: ReactNode
  }
> = {
  success: {
    shell: 'border-emerald-300/80 bg-gradient-to-br from-emerald-50 via-emerald-50 to-white text-emerald-950',
    iconWrap: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300/60',
    stat: 'border-emerald-300/60 bg-emerald-100/80 text-emerald-900',
    icon: <CheckCircle2 className="size-5" />,
  },
  warning: {
    shell: 'border-amber-300/80 bg-gradient-to-br from-amber-50 via-amber-50 to-white text-amber-950',
    iconWrap: 'bg-amber-100 text-amber-700 ring-1 ring-amber-300/60',
    stat: 'border-amber-300/60 bg-amber-100/80 text-amber-900',
    icon: <TriangleAlert className="size-5" />,
  },
  error: {
    shell: 'border-rose-300/80 bg-gradient-to-br from-rose-50 via-rose-50 to-white text-rose-950',
    iconWrap: 'bg-rose-100 text-rose-700 ring-1 ring-rose-300/60',
    stat: 'border-rose-300/60 bg-rose-100/80 text-rose-900',
    icon: <TriangleAlert className="size-5" />,
  },
  info: {
    shell: 'border-sky-300/80 bg-gradient-to-br from-sky-50 via-sky-50 to-white text-sky-950',
    iconWrap: 'bg-sky-100 text-sky-700 ring-1 ring-sky-300/60',
    stat: 'border-sky-300/60 bg-sky-100/80 text-sky-900',
    icon: <Info className="size-5" />,
  },
}

export function Toast({
  open,
  noticeId,
  tone,
  title,
  summary,
  addedCount = 0,
  skippedCount = 0,
  durationMs = 3000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    const id = window.setTimeout(onClose, durationMs)
    return () => window.clearTimeout(id)
  }, [open, noticeId, durationMs, onClose])

  if (!open) {
    return null
  }

  const style = toneStyle[tone]

  return (
    <div
      aria-live="polite"
      className={cn(
        'pointer-events-none fixed z-[70] transition-all duration-300',
        'left-4 right-4 bottom-4 sm:left-auto sm:right-6 sm:bottom-auto sm:top-6 sm:w-[430px]',
        open ? 'translate-y-0 opacity-100 sm:translate-x-0' : 'translate-y-3 opacity-0 sm:translate-y-0 sm:translate-x-4',
      )}
    >
      <div className={cn('pointer-events-auto rounded-2xl border p-4 shadow-[0_10px_28px_rgba(20,20,20,0.12)] sm:p-5', style.shell)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={cn('mt-0.5 grid size-9 place-items-center rounded-full', style.iconWrap)}>{style.icon}</div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-75">Reorder feedback</p>
              <p className="font-semibold sm:text-lg">{title}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-current/70 transition hover:bg-black/5 hover:text-current"
            aria-label="Close notification"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed sm:text-[15px]">{summary}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]">
          <span className={cn('rounded-full border px-3 py-1', style.stat)}>Added {addedCount}</span>
          <span className={cn('rounded-full border px-3 py-1', style.stat)}>Skipped {skippedCount}</span>
        </div>
      </div>
    </div>
  )
}
