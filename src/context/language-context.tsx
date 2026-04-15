import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { formatTranslation, getTranslation, languageOptions, LANGUAGE_STORAGE_KEY, type Language } from '../lib/i18n'

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string, values?: Record<string, string>) => string
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') {
      return 'fr'
    }

    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return languageOptions.some((option) => option.value === storedLanguage) ? (storedLanguage as Language) : 'fr'
  })

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    }
  }, [language])

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage)
  }, [])

  const t = useCallback(
    (key: string, values?: Record<string, string>) => formatTranslation(getTranslation(language, key), values),
    [language],
  )

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider')
  }

  return context
}
