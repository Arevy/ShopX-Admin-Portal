'use client'

import { useEffect, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  LANGUAGE_STORAGE_KEY,
  RTL_LANGUAGES,
  type Language,
} from './config'
import i18n from './i18n'

type Props = {
  children: ReactNode
}

const normaliseLanguage = (value: string | null | undefined): Language | null => {
  if (!value) {
    return null
  }

  const normalised = value.toLowerCase()

  if ((LANGUAGES as readonly string[]).includes(normalised)) {
    return normalised as Language
  }

  const shortCode = normalised.split('-')[0]
  const matched = LANGUAGES.find((language) => language.startsWith(shortCode))
  return matched ?? null
}

const applyDirectionAttributes = (language: Language) => {
  if (typeof document === 'undefined') {
    return
  }

  const isRtl = RTL_LANGUAGES.has(language)
  const dir = isRtl ? 'rtl' : 'ltr'

  document.documentElement.lang = language
  document.documentElement.dir = dir

  if (document.body) {
    document.body.dir = dir
    document.body.classList.toggle('rtl', isRtl)
  }
}

export const TranslationProvider = ({ children }: Props) => {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const stored = normaliseLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY))

    const browserPreference = (() => {
      const navigatorLanguages = window.navigator.languages ?? []
      for (const candidate of navigatorLanguages) {
        const match = normaliseLanguage(candidate)
        if (match) {
          return match
        }
      }

      return normaliseLanguage(window.navigator.language)
    })()

    const resolvedLanguage = stored ?? browserPreference ?? DEFAULT_LANGUAGE

    if (resolvedLanguage !== i18n.language) {
      void i18n.changeLanguage(resolvedLanguage)
    } else {
      applyDirectionAttributes(resolvedLanguage)
    }

    const handleLanguageChange = (nextLanguage: string) => {
      const validLanguage = normaliseLanguage(nextLanguage) ?? DEFAULT_LANGUAGE
      applyDirectionAttributes(validLanguage)
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, validLanguage)
    }

    handleLanguageChange(i18n.language ?? DEFAULT_LANGUAGE)

    i18n.on('languageChanged', handleLanguageChange)
    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
