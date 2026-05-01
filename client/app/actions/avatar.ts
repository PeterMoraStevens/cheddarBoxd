'use server'

import { createClient } from '@/lib/supabase/server'
import { s3, S3_BUCKET } from '@/lib/s3'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { revalidatePath } from 'next/cache'

export async function uploadAvatar(formData: FormData): Promise<{ avatarUrl: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const file = formData.get('file') as File | null
  if (!file) throw new Error('No file provided')

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const key = `avatars/${user.id}/${Date.now()}.jpg`

  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'image/jpeg',
    // ACL omitted — Garage does not support S3 ACLs.
    // Object access is controlled via Garage bucket permissions.
  }))

  // Store the bare key; the Avatar component resolves it through /api/s3-image.
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: key })
    .eq('id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/profile', 'layout')
  return { avatarUrl: key }
}

export async function deleteAvatar(avatarUrl: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const key = extractKey(avatarUrl)
  if (!key.startsWith(`avatars/${user.id}/`)) throw new Error('Unauthorized')

  await s3.send(new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  }))

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/profile', 'layout')
}

// Extracts the S3 key from either the new bare-key format or the legacy full CDN URL.
function extractKey(value: string): string {
  const cdnBase = process.env.NEXT_PUBLIC_CDN_BASE
  if (cdnBase && value.startsWith(cdnBase + '/')) {
    return value.slice(cdnBase.length + 1)
  }
  return value
}
