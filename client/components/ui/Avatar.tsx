import Image from 'next/image'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  xs: { px: 24, cls: 'w-6 h-6 text-xs' },
  sm: { px: 32, cls: 'w-8 h-8 text-xs' },
  md: { px: 40, cls: 'w-10 h-10 text-sm' },
  lg: { px: 56, cls: 'w-14 h-14 text-base' },
  xl: { px: 80, cls: 'w-20 h-20 text-xl' },
}

function getInitials(name?: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Bare S3 keys (no protocol) are served through /api/s3-image which
// generates a presigned GetObject URL. OAuth provider photos are used directly.
function resolveAvatarSrc(src: string): string {
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  return `/api/s3-image?key=${encodeURIComponent(src)}`
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const { px, cls } = sizeMap[size]
  const resolved = src ? resolveAvatarSrc(src) : null

  return (
    <div
      className={`
        ${cls} relative shrink-0 overflow-hidden border-2 border-[color:var(--border)] bg-primary
        flex items-center justify-center font-bold text-ink
        ${className}
      `}
    >
      {resolved ? (
        <Image
          src={resolved}
          alt={name ?? 'avatar'}
          width={px}
          height={px}
          className="object-cover w-full h-full"
          unoptimized
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  )
}
