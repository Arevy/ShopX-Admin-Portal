import Image from 'next/image'
import type { CSSProperties, ReactNode } from 'react'

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
  style?: CSSProperties
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
  style,
  fallback = null,
  unoptimized,
}: ModularImageProps) => {
  if (!src) {
    return fallback
  }

  const resolvedAlt = alt.trim() || 'Product image'
  const bypassOptimization =
    typeof unoptimized === 'boolean' ? unoptimized : src.startsWith('data:')

  if (!fill && (!width || !height)) {
    throw new Error('ModularImage requires width and height when fill is false.')
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
        style={style}
        unoptimized={bypassOptimization}
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
      style={style}
      unoptimized={bypassOptimization}
    />
  )
}
