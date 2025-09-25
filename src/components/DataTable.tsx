'use client'

import { ReactNode } from 'react'
import styles from './DataTable.module.scss'

export interface Column<T extends object> {
  key: keyof T | string
  header: string
  render?: (item: T) => ReactNode
}

interface DataTableProps<T extends object> {
  columns: Column<T>[]
  data: T[]
  emptyState?: ReactNode
}

export const DataTable = <T extends object>({
  columns,
  data,
  emptyState,
}: DataTableProps<T>) => {
  if (!data.length && emptyState) {
    return <div className="card">{emptyState}</div>
  }

  return (
    <div className={`surface-border ${styles.wrapper}`}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={String(column.key)}>
                  {column.render ? column.render(item) : String(item[column.key as keyof T] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
