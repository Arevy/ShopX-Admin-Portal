'use client'

import { useCallback } from 'react'
import { useTranslation as useI18nTranslation } from 'react-i18next'
import { DEFAULT_LANGUAGE, LANGUAGES, type Language } from './config'

type Primitive = string | number | boolean

type TranslateParams = Record<string, Primitive>

type UseTranslationResult = {
  t: (key: string, variables?: TranslateParams) => string
  language: Language
  setLanguage: (language: Language) => void
  availableLanguages: readonly Language[]
}

export const useTranslation = (namespace: string): UseTranslationResult => {
  const { t, i18n } = useI18nTranslation(namespace)

  const setLanguage = useCallback(
    (nextLanguage: Language) => {
      if (nextLanguage !== i18n.language) {
        void i18n.changeLanguage(nextLanguage)
      }
    },
    [i18n],
  )

  return {
    t,
    language: (LANGUAGES as readonly string[]).includes(i18n.language)
      ? (i18n.language as Language)
      : DEFAULT_LANGUAGE,
    setLanguage,
    availableLanguages: LANGUAGES,
  }
}
