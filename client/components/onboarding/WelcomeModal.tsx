'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/lib/toast'
import type { Profile } from '@/types/database'

const USERNAME_RE = /^[a-z0-9_]{3,30}$/

interface WelcomeModalProps {
  profile: Profile | null
}

export function WelcomeModal({ profile }: WelcomeModalProps) {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState<'welcome' | 'setup'>('welcome')
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [username, setUsername] = useState(profile?.username ?? '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('welcome') === '1') {
      setShow(true)
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  if (!show || !profile) return null

  const usernameError =
    username && !USERNAME_RE.test(username)
      ? '3–30 chars, lowercase, numbers, underscores only.'
      : null

  async function saveProfile() {
    if (usernameError || !profile) return
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

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim() || null,
        username: username.trim(),
      })
      .eq('id', profile.id)

    setLoading(false)

    if (error) {
      toast('Could not save profile. Try again.', 'error')
      return
    }

    toast('Welcome to CheddarBoxd! Profile saved.', 'success')
    setShow(false)
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70">
      <div
        className="neo-card w-full max-w-md overflow-hidden"
        style={{ boxShadow: '8px 8px 0 var(--border)' }}
      >
        {step === 'welcome' ? (
          <div className="p-8 flex flex-col items-center text-center gap-4">
            <div className="text-7xl leading-none select-none">🧀</div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight mb-1">
                Welcome to CheddarBoxd
              </h1>
              <p className="text-[color:var(--text-muted)] text-sm font-semibold">
                Your personal snack diary.
              </p>
            </div>

            <ul className="text-left flex flex-col gap-3 w-full mt-2">
              {[
                ['🔍', 'Search millions of snacks from the Open Food Facts database'],
                ['★', 'Rate and review everything you eat'],
                ['👥', 'Follow friends and see what they\'re snacking on'],
                ['📊', 'Build your personal snack map and rating stats'],
              ].map(([icon, text]) => (
                <li key={text} className="flex items-start gap-3 text-sm">
                  <span className="text-lg leading-none shrink-0 mt-0.5">{icon}</span>
                  <span className="text-[color:var(--text)]">{text}</span>
                </li>
              ))}
            </ul>

            <div className="flex gap-3 w-full mt-2">
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={() => setStep('setup')}
              >
                Set up my profile →
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setShow(false)}
              >
                Skip
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-8 flex flex-col gap-5">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Your Profile</h2>
              <p className="text-sm text-[color:var(--text-muted)] mt-1">
                You can always change this later in settings.
              </p>
            </div>

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

            <div className="flex gap-3">
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                loading={loading}
                disabled={!!usernameError || !username}
                onClick={saveProfile}
              >
                Let's go!
              </Button>
              <Button variant="secondary" size="lg" onClick={() => setStep('welcome')}>
                Back
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
