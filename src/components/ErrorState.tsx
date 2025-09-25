'use client'

import styles from './ErrorState.module.scss'

export const ErrorState = ({ message }: { message: string }) => {
  return (
    <div className={`card ${styles.wrapper}`}>
      <strong className={styles.title}>Something went wrong</strong>
      <span className={styles.message}>{message}</span>
    </div>
  )
}
