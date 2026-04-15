import { useState } from 'react'
import { Check, Languages } from 'lucide-react'
import { useLanguage } from '../../context/language-context'
import { languageOptions, type Language } from '../../lib/i18n'
import { Button } from '../ui/button'

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const { language, setLanguage, t } = useLanguage()

  const handleLanguageSelect = (nextLanguage: Language) => {
    setLanguage(nextLanguage)
    setIsOpen(false)
  }

  return (
    <div className="relative z-[60]">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <Languages className="size-4" />
        <span className="hidden text-xs sm:inline">
          {languageOptions.find((option) => option.value === language)?.label}
        </span>
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border/80 bg-card/95 shadow-xl ring-1 ring-black/5 backdrop-blur supports-[backdrop-filter]:bg-card/85">
            <div className="border-b border-border/80 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t('nav.language')}</p>
            </div>
            <div className="max-h-64 space-y-1 overflow-y-auto p-2">
              {languageOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={option.value === language ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-10 w-full justify-between rounded-lg px-3 text-sm"
                  onClick={() => handleLanguageSelect(option.value)}
                >
                  <span>{option.label}</span>
                  {option.value === language ? <Check className="size-4" /> : null}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
