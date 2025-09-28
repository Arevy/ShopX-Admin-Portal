'use client'

import classNames from 'classnames'
import { useRTL, useTranslation } from '@/i18n'
import styles from './LanguageSelector.module.scss'

export const LanguageSelector = ({ className }: { className?: string }) => {
  const { t, language, setLanguage, availableLanguages } = useTranslation('Common')
  const isRtl = useRTL()

  return (
    <label className={classNames(styles.wrapper, className, { [styles.wrapperRtl]: isRtl })} dir={isRtl ? 'rtl' : 'ltr'}>
      <span className={styles.label}>{t('language.label')}</span>
      <select
        className={styles.select}
        value={language}
        dir={isRtl ? 'rtl' : 'ltr'}
        onChange={(event) => setLanguage(event.target.value as typeof availableLanguages[number])}
        aria-label={t('language.accessibility_label')}
      >
        {availableLanguages.map((option) => (
          <option key={option} value={option}>
            {t(`language.options.${option}`)}
          </option>
        ))}
      </select>
    </label>
  )
}

export default LanguageSelector
