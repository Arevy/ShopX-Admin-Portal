'use client'

import { useTranslation } from '@/i18n'
import styles from './ErrorState.module.scss'

export const ErrorState = ({ message }: { message: string }) => {
  const { t } = useTranslation('Common')

  return (
    <div className={`card ${styles.wrapper}`}>
      <strong className={styles.title}>{t('common.errors.generic_title')}</strong>
      <span className={styles.message}>{message}</span>
    </div>
  )
}
