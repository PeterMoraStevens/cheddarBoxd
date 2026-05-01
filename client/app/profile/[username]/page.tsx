import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { ReviewCard } from "@/components/social/ReviewCard";
import { RatingChart } from "@/components/profile/RatingChart";
import { FollowButton } from "./FollowButton";
import { FollowStatsDialog } from "./FollowStatsDialog";
import { Star, BookOpen, Network, Pencil, Map, UserCheck } from "lucide-react";
import { computeImgUrl } from "@/lib/compute-img-url";
import { ProductImage } from "@/components/ui/ProductImage";
import type { ReviewWithProfile } from "@/types/database";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const isOwnProfile = currentUser?.id === profile.id;

  // Fetch stats + data in parallel
  // For own profile: RLS lets us see private reviews too (no is_public filter needed)
  // For others: RLS enforces is_public = true automatically
  const [
    { count: followerCount },
    { count: followingCount },
    { data: favorites },
    { data: reviews, error: reviewsError },
    { data: allRatings },
    { data: followStatus },
    { data: pendingRequestRow },
    { count: incomingRequestCount },
  ] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profile.id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profile.id),
    supabase
      .from("favorite_snacks")
      .select("*")
      .eq("user_id", profile.id)
      .order("display_order"),
    supabase
      .from("reviews")
      .select(
        "id, user_id, product_barcode, product_name, product_brand, product_image_url, rating, body, is_public, created_at, updated_at, profiles!user_id(*), review_likes(user_id), comments(id)",
      )
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("reviews").select("rating").eq("user_id", profile.id),
    currentUser
      ? supabase
          .from("follows")
          .select("*")
          .eq("follower_id", currentUser.id)
          .eq("following_id", profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    // Pending follow request from currentUser → this profile
    currentUser && !isOwnProfile
      ? supabase
          .from("follow_requests")
          .select("requester_id")
          .eq("requester_id", currentUser.id)
          .eq("requested_id", profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    // Incoming follow requests for own private profile
    isOwnProfile && profile.is_private
      ? supabase
          .from("follow_requests")
          .select("*", { count: "exact", head: true })
          .eq("requested_id", profile.id)
      : Promise.resolve({ count: 0 }),
  ]);

  if (reviewsError)
    console.error("[profile] reviews query error:", reviewsError);

  const typedReviews = (reviews ?? []) as ReviewWithProfile[];
  const isFollowing = !!followStatus;
  const hasPendingRequest = !!pendingRequestRow;
  const ratings = (allRatings ?? []).map((r) => r.rating);
  const reviewCount = ratings.length;

  const avgRating = ratings.filter(Boolean).length
    ? ratings.filter((r): r is number => r != null).reduce((a, b) => a + b, 0) /
      ratings.filter(Boolean).length
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="neo-card p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Avatar
            src={profile.avatar_url}
            name={profile.display_name || profile.username}
            size="xl"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-black tracking-tight">
                  {profile.display_name || profile.username}
                </h1>
                <p className="text-[color:var(--text-muted)] font-semibold">
                  @{profile.username}
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                {!isOwnProfile && currentUser && (
                  <FollowButton
                    followingId={profile.id}
                    initialIsFollowing={isFollowing}
                    isPrivate={profile.is_private}
                    initialHasPendingRequest={hasPendingRequest}
                  />
                )}
                {isOwnProfile && (
                  <Link
                    href="/profile/edit"
                    className="neo-btn bg-[color:var(--surface)] px-4 py-2 text-sm font-semibold flex items-center gap-2"
                  >
                    <Pencil size={14} />
                    Edit profile
                  </Link>
                )}
                {isOwnProfile && profile.is_private && (incomingRequestCount ?? 0) > 0 && (
                  <Link
                    href={`/profile/${username}/requests`}
                    className="neo-btn bg-primary text-ink px-4 py-2 text-sm font-semibold flex items-center gap-2"
                  >
                    <UserCheck size={14} />
                    {incomingRequestCount} Request{incomingRequestCount !== 1 ? 's' : ''}
                  </Link>
                )}
                <Link
                  href={`/profile/${username}/network`}
                  className="neo-btn bg-[color:var(--surface)] px-4 py-2 text-sm font-semibold flex items-center gap-2"
                >
                  <Network size={14} />
                  Network
                </Link>
                <Link
                  href={`/profile/${username}/snacks`}
                  className="neo-btn bg-[color:var(--surface)] px-4 py-2 text-sm font-semibold flex items-center gap-2"
                >
                  <Map size={14} />
                  Snack Map
                </Link>
              </div>
            </div>

            {profile.bio && (
              <p className="mt-3 text-sm text-[color:var(--text)] leading-relaxed max-w-lg">
                {profile.bio}
              </p>
            )}

            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-xs text-primary hover:underline inline-block"
              >
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mt-4">
              <div className="flex items-center gap-1.5">
                <BookOpen
                  size={14}
                  className="text-[color:var(--text-muted)]"
                />
                <span className="font-black text-lg">{reviewCount}</span>
                <span className="text-xs uppercase tracking-wide text-[color:var(--text-muted)] font-semibold">
                  Reviews
                </span>
              </div>
              <FollowStatsDialog
                profileId={profile.id}
                username={username}
                followerCount={followerCount ?? 0}
                followingCount={followingCount ?? 0}
                currentUserId={currentUser?.id}
              />
              {avgRating != null && (
                <div className="flex items-center gap-1.5">
                  <Star size={14} className="text-primary" />
                  <span className="font-black text-lg">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-[color:var(--text-muted)] font-semibold">
                    Avg
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Favorite snacks */}
          {favorites && favorites.length > 0 && (
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest mb-3">
                Favorites
              </h2>
              <div className="grid grid-cols-5 gap-1 lg:grid-cols-1 lg:gap-2">
                {favorites.map((fav) => (
                  <Link
                    key={fav.product_barcode}
                    href={`/snack/${fav.product_barcode}`}
                    title={fav.product_name}
                  >
                    <div className="neo-card-hover aspect-square relative overflow-hidden">
                      <ProductImage
                        src={computeImgUrl(fav.product_barcode)}
                        alt={fav.product_name}
                        fill
                        className="object-contain p-2"
                        sizes="80px"
                      />
                    </div>
                    <p className="mt-1 text-xs font-semibold line-clamp-1 hidden lg:block">
                      {fav.product_name}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Rating chart */}
          <RatingChart ratings={ratings} />
        </div>

        {/* Main — reviews */}
        <div className="lg:col-span-3">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-black uppercase tracking-tight">
              {isOwnProfile ? "Your Reviews" : "Recent Reviews"}
            </h2>
            {reviewCount > 12 && (
              <Link
                href={`/profile/${username}/reviews`}
                className="text-sm font-semibold text-primary hover:underline"
              >
                View all →
              </Link>
            )}
          </div>

          {typedReviews.length === 0 ? (
            <div className="neo-card p-8 text-center">
              <p className="text-[color:var(--text-muted)] text-sm">
                {isOwnProfile
                  ? "You haven't reviewed anything yet. Find a snack and share your thoughts!"
                  : "No reviews yet."}
              </p>
              {isOwnProfile && (
                <Link
                  href="/search"
                  className="mt-3 neo-btn bg-primary text-ink px-4 py-2 text-sm font-semibold inline-block"
                >
                  Find snacks
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {typedReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  currentUserId={currentUser?.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
