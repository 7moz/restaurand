import { useState } from 'react'
import axios from 'axios'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, MapPin, MessageCircle, Phone } from 'lucide-react'
import { reclamationApi } from '../api'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { useLanguage } from '../context/language-context'
import locationImage from '../assets/location.webp'

const subjectOptionKeys = [
  'contactPage.subjectPrivateDining',
  'contactPage.subjectMediaInquiry',
  'contactPage.subjectPartnership',
  'contactPage.subjectOther',
] as const

export function ContactPage() {
  const { t } = useLanguage()
  const directionsUrl = 'https://www.google.com/maps/search/?api=1&query=48.88573784494155,2.3816335134943807'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState<(typeof subjectOptionKeys)[number]>(subjectOptionKeys[0])
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const submitMutation = useMutation({
    mutationFn: async () => {
      return reclamationApi.submitPublic({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        subject: t(subject),
        message: message.trim(),
      })
    },
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      setSubmitError('')
      await submitMutation.mutateAsync()
      setSubmitted(true)
      setFullName('')
      setEmail('')
      setPhone('')
      setSubject(subjectOptionKeys[0])
      setMessage('')
    } catch (error) {
      setSubmitted(false)

      if (axios.isAxiosError(error)) {
        const apiMessage = typeof error.response?.data?.message === 'string' ? error.response.data.message : error.message
        setSubmitError(apiMessage)
      } else {
        setSubmitError(error instanceof Error ? error.message : t('contactPage.inquiryFailedDescription'))
      }
    }
  }

  return (
    <div className="space-y-10">
      <section className="space-y-4 rounded-3xl bg-[#f2f0e8] p-6 sm:p-10">
        <p className="text-xs uppercase tracking-[0.16em] text-primary">{t('contactPage.eyebrow')}</p>
        <h1 className="max-w-4xl text-4xl leading-[0.95] sm:text-6xl">{t('contactPage.heroTitle')}</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t('contactPage.heroDescription')}
        </p>
      </section>

      {submitted ? (
        <Alert variant="success">
          <AlertTitle>{t('contactPage.inquirySent')}</AlertTitle>
          <AlertDescription>{t('contactPage.inquirySentDescription')}</AlertDescription>
        </Alert>
      ) : null}

      {submitError ? (
        <Alert variant="destructive">
          <AlertTitle>{t('contactPage.inquiryFailed')}</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-12">
        <Card className="border-border/40 bg-[#f6f4ee] lg:col-span-7">
          <CardHeader>
            <CardTitle className="text-3xl">{t('contactPage.conciergeTitle')}</CardTitle>
            <CardDescription>{t('contactPage.conciergeDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{t('contactPage.fullName')}</label>
                  <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder={t('contactPage.fullNamePlaceholder')} required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{t('contactPage.emailAddress')}</label>
                  <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t('contactPage.emailPlaceholder')} required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{t('contactPage.phone')}</label>
                <Input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={t('contactPage.phonePlaceholder')} />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{t('contactPage.subject')}</label>
                <select
                  value={subject}
                  onChange={(event) => setSubject(event.target.value as (typeof subjectOptionKeys)[number])}
                  className="h-11 w-full rounded-xl border border-input bg-input px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {subjectOptionKeys.map((item) => (
                    <option key={item} value={item}>
                      {t(item)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{t('contactPage.message')}</label>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={t('contactPage.messagePlaceholder')}
                  required
                  rows={5}
                  className="w-full resize-y rounded-xl border border-input bg-input px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </div>
              <Button type="submit" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? t('contactPage.sendingInquiry') : t('contactPage.sendInquiry')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:col-span-5">
          <div className="relative h-72 overflow-hidden rounded-2xl border border-border/30 bg-[#ece9df]">
            <img
              src={locationImage}
              alt={t('contactPage.mapAlt')}
              className="h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-primary/10" />
            <div className="absolute bottom-4 left-4 rounded-lg bg-card/90 px-4 py-3 shadow-lg backdrop-blur">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em]">
                <MapPin className="size-3.5 text-primary" /> {t('contactPage.mainResidence')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t('contactPage.address')}</p>
              <Button asChild className="mt-3 gap-2" size="sm" variant="outline">
                <a href={directionsUrl} rel="noreferrer" target="_blank">
                  {t('contactPage.visitUs')}
                  <ArrowRight className="size-4" />
                </a>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-border/30 bg-[#f6f4ee]">
              <CardHeader>
                <CardTitle className="inline-flex items-center gap-2 text-base">
                  <Phone className="size-4 text-primary" /> {t('contactPage.serviceHours')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{t('contactPage.weeklyHours')}</p>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-[#f6f4ee]">
              <CardHeader>
                <CardTitle className="inline-flex items-center gap-2 text-base">
                  <MessageCircle className="size-4 text-primary" /> {t('contactPage.quickContact')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="inline-flex items-center gap-2">
                  <Phone className="size-4" /> {t('contactPage.phoneNumber')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

    </div>
  )
}
