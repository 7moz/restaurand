import { LogIn, X } from 'lucide-react'
import { Button } from '../ui/button'

interface LoginPromptModalProps {
  open: boolean
  title: string
  description: string
  onLogin: () => void
  onClose: () => void
}

export function LoginPromptModal({ open, title, description, onLogin, onClose }: LoginPromptModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close login prompt">
            <X className="size-4" />
          </Button>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Continue browsing
          </Button>
          <Button type="button" className="gap-2" onClick={onLogin}>
            <LogIn className="size-4" />
            Login to continue
          </Button>
        </div>
      </div>
    </div>
  )
}