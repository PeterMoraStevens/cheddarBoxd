import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EditProfileForm } from './EditProfileForm'
import { DeleteAccountButton } from './DeleteAccountButton'

export default async function EditProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?next=/profile/edit')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black uppercase tracking-tight mb-8">Edit Profile</h1>
      <EditProfileForm profile={profile} />

      <div className="mt-12 pt-8 border-t-2 border-[color:var(--border)]">
        <h2 className="text-xl font-black uppercase tracking-tight mb-2 text-red-500">Danger Zone</h2>
        <p className="text-sm text-[color:var(--text-muted)] mb-4">Permanently delete your account and all associated data.</p>
        <DeleteAccountButton />
      </div>
    </div>
  )
}
