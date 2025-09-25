'use client'

import styles from './StatusBadge.module.scss'

const KNOWN_TONES = new Set(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])

export const StatusBadge = ({ status }: { status: string }) => {
  const tone = status.toLowerCase()

  return (
    <span className={`badge ${styles.wrapper}`} data-tone={KNOWN_TONES.has(tone) ? tone : undefined}>
      {status}
    </span>
  )
}
