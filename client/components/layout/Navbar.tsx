'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Search, Menu, X, Sun, Moon, User, LogOut, ChevronDown, Settings } from 'lucide-react'
import type { Profile } from '@/types/database'
import { Avatar } from '@/components/ui/Avatar'
import { useTheme } from '@/components/ThemeProvider'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NavbarProps {
  profile: Profile | null
}

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function toggleTheme() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href)
  }

  const navLinks = [
    { href: '/feed', label: 'Feed' },
    { href: '/search', label: 'Explore' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-[color:var(--bg)] border-b-2 border-[color:var(--border)]">
      <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight shrink-0">
          <span>
            <span className="text-[color:var(--text)]">cheddar</span>
            <span className="text-primary">boxd</span>
          </span>
        </Link>

        {/* Desktop nav — authenticated only */}
        {profile && (
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold uppercase tracking-wide transition-colors hover:text-primary ${
                  isActive(link.href) ? 'text-primary' : 'text-[color:var(--text)]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle — always visible */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-[color:var(--muted)] border-2 border-transparent hover:border-[color:var(--border)] transition-colors"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {profile ? (
            <>
              {/* Search icon — authenticated desktop only */}
              <Link
                href="/search"
                className="hidden md:inline-flex p-2 hover:bg-[color:var(--muted)] border-2 border-transparent hover:border-[color:var(--border)] transition-colors"
                aria-label="Search"
              >
                <Search size={18} />
              </Link>

              {/* Desktop avatar dropdown */}
              <div className="hidden md:block relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 hover:bg-[color:var(--muted)] border-2 border-transparent hover:border-[color:var(--border)] transition-colors"
                >
                  <Avatar src={profile.avatar_url} name={profile.display_name || profile.username} size="xs" />
                  <span className="hidden sm:block text-sm font-semibold max-w-24 truncate">
                    {profile.username}
                  </span>
                  <ChevronDown size={14} className="text-[color:var(--text-muted)]" />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-48 neo-card z-50 py-1">
                      <Link
                        href={`/profile/${profile.username}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-[color:var(--muted)] transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User size={14} />
                        Profile
                      </Link>
                      <Link
                        href="/profile/edit"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-[color:var(--muted)] transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Settings
                      </Link>
                      <hr className="border-[color:var(--border)] my-1" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-[color:var(--muted)] w-full text-left text-red-500 transition-colors"
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                className="md:hidden p-2 border-2 border-[color:var(--border)]"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </>
          ) : (
            /* Unauthenticated: Sign in button only */
            <Link
              href="/auth/login"
              className="neo-btn bg-primary text-ink px-4 py-2 text-sm font-semibold"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile dropdown overlay — authenticated only */}
      {profile && mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 z-50 bg-[color:var(--bg)] border-b-2 border-[color:var(--border)]">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-3 text-sm font-semibold uppercase tracking-wide border-b border-[color:var(--muted)] hover:bg-[color:var(--muted)] transition-colors ${
                isActive(link.href) ? 'text-primary' : 'text-[color:var(--text)]'
              }`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <hr className="border-[color:var(--border)]" />

          {/* Avatar + username row */}
          <Link
            href={`/profile/${profile.username}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-[color:var(--muted)] transition-colors border-b border-[color:var(--muted)]"
            onClick={() => setMobileOpen(false)}
          >
            <Avatar src={profile.avatar_url} name={profile.display_name || profile.username} size="xs" />
            <span className="text-sm font-semibold">{profile.username}</span>
          </Link>

          <Link
            href="/profile/edit"
            className="flex items-center gap-2 px-4 py-3 text-sm font-semibold hover:bg-[color:var(--muted)] transition-colors border-b border-[color:var(--muted)]"
            onClick={() => setMobileOpen(false)}
          >
            <Settings size={14} />
            Settings
          </Link>

          <button
            onClick={() => { setMobileOpen(false); handleSignOut() }}
            className="flex items-center gap-2 px-4 py-3 text-sm font-semibold w-full text-left text-red-500 hover:bg-[color:var(--muted)] transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </header>
  )
}
