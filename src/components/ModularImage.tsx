import Image from 'next/image'
import type { ReactNode } from 'react'

interface ModularImageProps {
  src?: string | null
  alt: string
  className?: string
  fill?: boolean
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
  quality?: number
  fallback?: ReactNode
  unoptimized?: boolean
}

export const ModularImage = ({
  src,
  alt,
  className,
  fill = false,
  width,
  height,
  sizes = '100vw',
  priority = false,
  quality,
  fallback = null,
  unoptimized,
}: ModularImageProps) => {
  if (!src) {
    return fallback
  }

  const resolvedAlt = alt.trim() || 'Product image'
  const derivedUnoptimized = (() => {
    if (typeof unoptimized === 'boolean') {
      return unoptimized
    }

    if (src.startsWith('data:')) {
      return true
    }

    if (/^https?:\/\//i.test(src)) {
      return true
    }

    return false
  })()

  if (!fill && (!width || !height)) {
    throw new Error('ModularImage requires width and height when fill is false.')
  }

  const renderImgElement = () => (
    // eslint-disable-next-line @next/next/no-img-element -- Fallback for remote assets outside Next image allowlist
    <img
      src={src}
      alt={resolvedAlt}
      className={className}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      style={fill ? { objectFit: 'cover', width: '100%', height: '100%' } : undefined}
    />
  )

  if (derivedUnoptimized && /^https?:\/\//i.test(src)) {
    return renderImgElement()
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={resolvedAlt}
        fill
        sizes={sizes}
        className={className}
        priority={priority}
        quality={quality}
        unoptimized={derivedUnoptimized}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={resolvedAlt}
      width={width}
      height={height}
      sizes={sizes}
      className={className}
      priority={priority}
      quality={quality}
      unoptimized={derivedUnoptimized}
    />
  )
}
