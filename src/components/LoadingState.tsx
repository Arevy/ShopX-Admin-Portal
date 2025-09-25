'use client'

import styles from './LoadingState.module.scss'

export const LoadingState = ({ label = 'Loading data…' }: { label?: string }) => {
  return (
    <div className={`card ${styles.wrapper}`}>
      <span className={styles.spinner} />
      <span>{label}</span>
    </div>
  )
}
