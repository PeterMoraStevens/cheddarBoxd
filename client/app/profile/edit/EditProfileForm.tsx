'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { toast } from '@/lib/toast'
import type { Profile } from '@/types/database'

interface EditProfileFormProps {
  profile: Profile
}

const USERNAME_RE = /^[a-z0-9_]{3,30}$/

export function EditProfileForm({ profile }: EditProfileFormProps) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url)
  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [username, setUsername] = useState(profile.username)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [website, setWebsite] = useState(profile.website ?? '')
  const [isPrivate, setIsPrivate] = useState(profile.is_private)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const usernameError = username && !USERNAME_RE.test(username)
    ? 'Usernames must be 3–30 chars, lowercase letters, numbers, and underscores only.'
    : null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (usernameError) return

    setLoading(true)

    const supabase = createClient()

    if (username !== profile.username) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', profile.id)
        .maybeSingle()

      if (existing) {
        toast('That username is already taken.', 'error')
        setLoading(false)
        return
      }
    }

    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim() || null,
        username: username.trim(),
        bio: bio.trim() || null,
        website: website.trim() || null,
        is_private: isPrivate,
      })
      .eq('id', profile.id)

    setLoading(false)

    if (dbError) {
      toast(dbError.message, 'error')
      return
    }

    toast('Profile saved!', 'success')
    router.refresh()
    setTimeout(() => router.push(`/profile/${username.trim()}`), 600)
  }

  return (
    <div className="flex flex-col gap-8">
      <AvatarUpload
        currentAvatarUrl={avatarUrl}
        displayName={displayName || profile.display_name || profile.username}
        username={profile.username}
        onAvatarChange={(url) => setAvatarUrl(url)}
      />

      <form onSubmit={submit} className="flex flex-col gap-6">
        <Input
          label="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          maxLength={60}
        />

        <div>
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="your_username"
            maxLength={30}
            error={usernameError ?? undefined}
          />
          <p className="mt-1 text-xs text-[color:var(--text-muted)]">
            cheddarboxd.app/profile/<strong>{username || '…'}</strong>
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold uppercase tracking-wide text-[color:var(--text)]">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell the world about your snack philosophy…"
            rows={3}
            maxLength={200}
            className="neo-input w-full px-3 py-2.5 text-sm resize-none"
          />
          <p className="text-xs text-[color:var(--text-muted)] text-right">{bio.length}/200</p>
        </div>

        <Input
          label="Website"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://yourwebsite.com"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold uppercase tracking-wide text-[color:var(--text)]">Privacy</label>
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-primary"
            />
            <div>
              <p className="text-sm font-semibold leading-tight">Private account</p>
              <p className="text-xs text-[color:var(--text-muted)] mt-0.5">
                New followers must be approved before they can see your reviews.
              </p>
            </div>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="primary" size="lg" loading={loading} type="submit">
            Save changes
          </Button>
          <Button
            variant="secondary"
            size="lg"
            type="button"
            onClick={() => router.push(`/profile/${profile.username}`)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
