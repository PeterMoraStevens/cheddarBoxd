import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import Navbar from '@/components/layout/Navbar'
import { Toaster } from '@/components/ui/Toaster'
import { WelcomeModal } from '@/components/onboarding/WelcomeModal'
import { createClient } from '@/lib/supabase/server'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'cheddarboxd — track snacks, share discoveries',
  description: 'Rate and review snacks. See what your friends are eating. Discover the world\'s best (and worst) snacks.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <html lang="en" className={spaceGrotesk.variable} suppressHydrationWarning>
      <head>
        {/* Prevent FOUC for dark mode */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(t==='system'||!t)&&window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col font-[family-name:var(--font-space)]">
        <ThemeProvider>
          <Navbar profile={profile} />
          <main className="flex-1">
            {children}
          </main>
          <Toaster />
          <WelcomeModal profile={profile} />
        </ThemeProvider>
      </body>
    </html>
  )
}
