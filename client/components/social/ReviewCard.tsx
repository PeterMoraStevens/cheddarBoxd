import Link from "next/link";
import { formatDistanceToNow } from "./dateUtils";
import { Avatar } from "@/components/ui/Avatar";
import { StarDisplay } from "@/components/ui/StarRating";
import { LikeButton } from "./LikeButton";
import { computeImgUrl } from "@/lib/compute-img-url";
import { ProductImage } from "@/components/ui/ProductImage";
import { MessageCircle } from "lucide-react";
import type { ReviewWithProfile } from "@/types/database";

interface ReviewCardProps {
  review: ReviewWithProfile;
  currentUserId?: string;
  showSnack?: boolean;
}

export function ReviewCard({
  review,
  currentUserId,
  showSnack = true,
}: ReviewCardProps) {
  const profile = review.profiles;
  const likeCount = review.review_likes?.length ?? 0;
  const commentCount = review.comments?.length ?? 0;
  const liked = currentUserId
    ? (review.review_likes ?? []).some((l) => l.user_id === currentUserId)
    : false;

  return (
    <article className="neo-card p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href={`/profile/${profile.username}`} className="shrink-0">
          <Avatar
            src={profile.avatar_url}
            name={profile.display_name || profile.username}
            size="sm"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <Link
              href={`/profile/${profile.username}`}
              className="font-bold text-sm hover:text-primary transition-colors"
            >
              {profile.display_name || profile.username}
            </Link>
            <span className="text-xs text-[color:var(--text-muted)]">
              @{profile.username}
            </span>
            <span className="text-xs text-[color:var(--text-muted)] ml-auto">
              {formatDistanceToNow(review.created_at)}
            </span>
          </div>
          {review.rating != null && (
            <StarDisplay rating={review.rating} size="sm" />
          )}
        </div>
      </div>

      {/* Snack reference */}
      {showSnack && (
        <Link
          href={`/snack/${review.product_barcode}`}
          className="flex items-center gap-3 group"
        >
          <div className="w-12 h-12 border-2 border-[color:var(--border)] bg-[color:var(--muted)] shrink-0 overflow-hidden relative">
            <ProductImage
              src={computeImgUrl(review.product_barcode)}
              alt={review.product_name}
              fill
              sizes="48px"
              className="object-contain p-1"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-1">
              {review.product_name}
            </p>
            {review.product_brand && (
              <p className="text-xs text-[color:var(--text-muted)] uppercase tracking-wide">
                {review.product_brand}
              </p>
            )}
          </div>
        </Link>
      )}

      {/* Review body */}
      {review.body && (
        <p className="text-sm text-[color:var(--text)] leading-relaxed line-clamp-3">
          {review.body}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1 border-t border-[color:var(--muted)]">
        <LikeButton
          reviewId={review.id}
          initialLiked={liked}
          initialCount={likeCount}
          userId={currentUserId}
        />
        <Link
          href={`/review/${review.id}#comments`}
          className="flex items-center gap-1.5 text-xs text-[color:var(--text-muted)] hover:text-primary transition-colors"
        >
          <MessageCircle size={14} />
          <span>{commentCount}</span>
        </Link>
        <Link
          href={`/review/${review.id}`}
          className="ml-auto text-xs font-semibold text-[color:var(--text-muted)] hover:text-primary transition-colors uppercase tracking-wide"
        >
          View
        </Link>
      </div>
    </article>
  );
}
