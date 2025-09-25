'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'

const ReactQuill = dynamic(async () => import('react-quill'), { ssr: false })

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  readOnly?: boolean
}

const modules: ComponentProps<typeof ReactQuill>['modules'] = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'blockquote', 'code-block'],
    ['clean'],
  ],
}

export const RichTextEditor = ({ value, onChange, placeholder, className, readOnly }: Props) => {
  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      modules={modules}
      className={className}
      placeholder={placeholder}
      readOnly={readOnly}
    />
  )
}
