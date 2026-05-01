import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { FollowButton } from '@/app/profile/[username]/FollowButton'
import type { Profile } from '@/types/database'

interface UserCardProps {
  profile: Profile
  currentUserId?: string
  isFollowing?: boolean
  hasPendingRequest?: boolean
}

export function UserCard({ profile, currentUserId, isFollowing = false, hasPendingRequest = false }: UserCardProps) {
  return (
    <div className="neo-card p-4 flex items-center gap-4">
      <Link href={`/profile/${profile.username}`} className="shrink-0">
        <Avatar
          src={profile.avatar_url}
          name={profile.display_name || profile.username}
          size="md"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          href={`/profile/${profile.username}`}
          className="font-bold hover:text-primary transition-colors block truncate"
        >
          {profile.display_name || profile.username}
        </Link>
        <p className="text-xs text-[color:var(--text-muted)] truncate">@{profile.username}</p>
        {profile.bio && (
          <p className="text-xs text-[color:var(--text-muted)] mt-1 line-clamp-1">{profile.bio}</p>
        )}
      </div>

      {currentUserId && currentUserId !== profile.id && (
        <div className="shrink-0">
          <FollowButton
            followingId={profile.id}
            initialIsFollowing={isFollowing}
            isPrivate={profile.is_private}
            initialHasPendingRequest={hasPendingRequest}
          />
        </div>
      )}
    </div>
  )
}
