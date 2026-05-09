'use client'

import Image from 'next/image'
import { useState } from 'react'

interface ProductImageProps {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  sizes?: string
  priority?: boolean
}

export function ProductImage({ src, alt, fill, className, ...rest }: ProductImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className={`${fill ? 'absolute inset-0' : ''} flex items-center justify-center bg-[color:var(--muted)] select-none`}>
        <Image src="/cheese.png" alt="Cheese" width={48} height={48} />
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      onError={() => setFailed(true)}
      {...rest}
    />
  )
}
