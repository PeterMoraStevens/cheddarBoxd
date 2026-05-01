'use client'

import { useState } from 'react'

interface StarRatingProps {
  value?: number | null
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

function HalfStar({ filled, half, className }: { filled: boolean; half?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {half ? (
        <>
          <path
            d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"
            fill="currentColor"
            clipPath="inset(0 50% 0 0)"
          />
          <path
            d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </>
      ) : (
        <path
          d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"
          fill={filled ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      )}
    </svg>
  )
}

export function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null)

  const display = hover ?? value ?? 0
  const starSize = sizeMap[size]

  function handleMouseMove(e: React.MouseEvent<HTMLButtonElement>, starIndex: number) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isHalf = x < rect.width / 2
    setHover(isHalf ? starIndex - 0.5 : starIndex)
  }

  function handleClick(e: React.MouseEvent<HTMLButtonElement>, starIndex: number) {
    if (!onChange) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isHalf = x < rect.width / 2
    onChange(isHalf ? starIndex - 0.5 : starIndex)
  }

  if (readonly) {
    return (
      <div className="flex items-center gap-0.5 text-primary">
        {[1, 2, 3, 4, 5].map((i) => (
          <HalfStar
            key={i}
            filled={display >= i}
            half={display >= i - 0.5 && display < i}
            className={starSize}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-0.5 text-primary"
      onMouseLeave={() => setHover(null)}
      role="group"
      aria-label="Star rating"
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseMove={(e) => handleMouseMove(e, i)}
          onClick={(e) => handleClick(e, i)}
          className="focus:outline-none cursor-pointer"
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
        >
          <HalfStar
            filled={display >= i}
            half={display >= i - 0.5 && display < i}
            className={starSize}
          />
        </button>
      ))}
      {display > 0 && (
        <span className="ml-1 text-sm font-semibold text-[color:var(--text-muted)]">
          {display.toFixed(1)}
        </span>
      )}
    </div>
  )
}

export function StarDisplay({ rating, size = 'sm' }: { rating?: number | null; size?: 'sm' | 'md' | 'lg' }) {
  if (!rating) return <span className="text-xs text-[color:var(--text-muted)]">No rating</span>
  return <StarRating value={rating} readonly size={size} />
}
