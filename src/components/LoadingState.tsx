'use client'

import { useTranslation } from '@/i18n'
import styles from './LoadingState.module.scss'

export const LoadingState = ({ label }: { label?: string }) => {
  const { t } = useTranslation('Common')
  const displayLabel = label ?? t('common.loading.default')

  return (
    <div className={`card ${styles.wrapper}`}>
      <span className={styles.spinner} />
      <span>{displayLabel}</span>
    </div>
  )
}
