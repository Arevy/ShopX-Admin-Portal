'use client'

import { useTranslation } from '@/i18n'
import styles from './StatusBadge.module.scss'

const KNOWN_TONES = new Set(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])

export const StatusBadge = ({ status }: { status: string }) => {
  const { t } = useTranslation('Common')
  const tone = status.toLowerCase()
  const translationKey = `order_status.${tone}`
  const translated = t(translationKey)
  const label = translated === translationKey ? status : translated

  return (
    <span className={`badge ${styles.wrapper}`} data-tone={KNOWN_TONES.has(tone) ? tone : undefined}>
      {label}
    </span>
  )
}
