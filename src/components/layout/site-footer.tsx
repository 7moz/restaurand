import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useLanguage } from '../../context/language-context'

const legalLinks = [
  { labelKey: 'footer.privacyPolicy', to: ROUTES.contact },
  { labelKey: 'footer.termsOfService', to: ROUTES.contact },
  { labelKey: 'footer.sustainability', to: ROUTES.about },
  { labelKey: 'footer.careers', to: ROUTES.contact },
  { labelKey: 'footer.contact', to: ROUTES.contact },
]

export function SiteFooter() {
  const { t } = useLanguage()

  return (
    <footer className="mt-14 bg-[#181a18] py-8 text-[#ece9dd] sm:py-10">
      <div className="editorial-container flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="font-serif text-xl">{t('footer.brand')}</p>
          <p className="text-xs uppercase tracking-[0.08em] text-[#c8c2b2]">{t('footer.tagline')}</p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs uppercase tracking-[0.08em] text-[#d4cfbf]">
          {legalLinks.map((item) => (
            <Link key={item.labelKey} to={item.to} className="transition hover:text-white">
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
