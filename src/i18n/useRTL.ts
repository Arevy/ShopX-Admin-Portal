'use client'

import { useEffect, useState } from 'react'
import { useTranslation as useI18nTranslation } from 'react-i18next'

const isLanguageRTL = (dir: (language: string) => 'ltr' | 'rtl' | 'auto', language: string) => dir(language) === 'rtl'

export const useRTL = () => {
  const { i18n } = useI18nTranslation()
  const [isRtl, setIsRtl] = useState(() => isLanguageRTL(i18n.dir, i18n.language))

  useEffect(() => {
    const handleLanguageChange = (nextLanguage: string) => {
      setIsRtl(isLanguageRTL(i18n.dir, nextLanguage))
    }

    i18n.on('languageChanged', handleLanguageChange)
    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [i18n])

  return isRtl
}
