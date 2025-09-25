'use client'

import classNames from 'classnames'
import styles from './MetricCard.module.scss'

interface MetricCardProps {
  label: string
  value: string
  delta?: string
  tone?: 'accent' | 'success' | 'warning' | 'neutral'
}

const toneClassMap: Record<NonNullable<MetricCardProps['tone']>, string> = {
  accent: styles.wrapperAccent,
  success: styles.wrapperSuccess,
  warning: styles.wrapperWarning,
  neutral: styles.wrapperNeutral,
}

export const MetricCard = ({ label, value, delta, tone = 'accent' }: MetricCardProps) => {
  return (
    <div className={classNames('card', styles.wrapper, toneClassMap[tone])}>
      <p className={styles.label}>{label}</p>
      <div className={styles.valueRow}>
        <span className={styles.value}>{value}</span>
        {delta ? (
          <span className={classNames(styles.delta, { [styles.deltaSuccess]: tone === 'success' })}>
            {delta}
          </span>
        ) : null}
      </div>
    </div>
  )
}
