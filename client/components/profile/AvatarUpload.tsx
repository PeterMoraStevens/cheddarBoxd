'use client'

import { useState, useRef, useCallback } from 'react'
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { uploadAvatar, deleteAvatar } from '@/app/actions/avatar'
import { toast } from '@/lib/toast'

const CDN_BASE = process.env.NEXT_PUBLIC_CDN_BASE ?? ''

function isHostedPhoto(url: string | null): boolean {
  if (!url) return false
  // Legacy format: full CDN URL
  if (CDN_BASE && url.startsWith(CDN_BASE + '/')) return true
  // New format: bare S3 key (no protocol prefix)
  if (!url.startsWith('https://') && !url.startsWith('http://')) return true
  return false
}

interface AvatarUploadProps {
  currentAvatarUrl: string | null
  displayName: string
  username: string
  onAvatarChange: (newUrl: string | null) => void
}

export function AvatarUpload({
  currentAvatarUrl,
  displayName,
  username,
  onAvatarChange,
}: AvatarUploadProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasHostedPhoto = isHostedPhoto(currentAvatarUrl)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    setObjectUrl(URL.createObjectURL(file))
    setCrop(undefined)
    setCompletedCrop(undefined)
    setError(null)
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth, naturalHeight } = e.currentTarget
    const initial = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, naturalWidth, naturalHeight),
      naturalWidth,
      naturalHeight
    )
    setCrop(initial)
  }

  const confirmCrop = useCallback(async () => {
    const image = imageRef.current
    if (!image || !completedCrop) return

    const canvas = document.createElement('canvas')
    const OUTPUT_SIZE = 400
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE
    )

    canvas.toBlob(async (blob) => {
      if (!blob) { setError('Could not process image.'); return }
      setIsUploading(true)
      setError(null)
      try {
        const fd = new FormData()
        fd.append('file', blob, 'avatar.jpg')
        const { avatarUrl } = await uploadAvatar(fd)
        onAvatarChange(avatarUrl)
        cancelCrop()
        toast('Profile photo updated!', 'success')
      } catch {
        setError('Upload failed. Please try again.')
        toast('Upload failed. Please try again.', 'error')
      } finally {
        setIsUploading(false)
      }
    }, 'image/jpeg', 0.92)
  }, [completedCrop, onAvatarChange])

  function cancelCrop() {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    setObjectUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDelete() {
    if (!currentAvatarUrl) return
    setIsDeleting(true)
    setError(null)
    try {
      await deleteAvatar(currentAvatarUrl)
      onAvatarChange(null)
      toast('Profile photo removed.', 'info')
    } catch {
      setError('Delete failed. Please try again.')
      toast('Delete failed. Please try again.', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="neo-card p-4">
      <p className="text-sm font-black uppercase tracking-wide mb-4">Profile Photo</p>

      <div className="flex items-start gap-4">
        <Avatar src={currentAvatarUrl} name={displayName || username} size="xl" />

        <div className="flex flex-col gap-2">
          {hasHostedPhoto ? (
            <>
              <p className="text-xs text-[color:var(--text-muted)]">
                Delete your current photo before uploading a new one.
              </p>
              <Button variant="danger" size="sm" loading={isDeleting} onClick={handleDelete}>
                Delete photo
              </Button>
            </>
          ) : (
            <>
              {currentAvatarUrl && (
                <p className="text-xs text-[color:var(--text-muted)]">
                  Currently using your sign-in provider photo.
                </p>
              )}
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload photo
              </Button>
            </>
          )}

          {error && !objectUrl && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Crop modal */}
      {objectUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-[color:var(--surface)] border-2 border-[color:var(--border)] shadow-neo-lg p-6 max-w-xl w-full">
            <h3 className="font-black text-lg uppercase tracking-tight mb-4">Crop photo</h3>

            <div className="flex justify-center mb-4 overflow-hidden">
              <ReactCrop
                crop={crop}
                onChange={(_, pct) => setCrop(pct)}
                onComplete={(px) => setCompletedCrop(px)}
                aspect={1}
                circularCrop
                minWidth={80}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imageRef}
                  src={objectUrl}
                  alt="Upload preview"
                  onLoad={onImageLoad}
                  style={{ maxHeight: 420, maxWidth: '100%', display: 'block' }}
                />
              </ReactCrop>
            </div>

            {error && (
              <p className="text-sm text-red-500 border-2 border-red-500 px-3 py-2 mb-4">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                variant="primary"
                loading={isUploading}
                disabled={!completedCrop}
                onClick={confirmCrop}
              >
                Confirm
              </Button>
              <Button variant="secondary" onClick={cancelCrop} disabled={isUploading}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
