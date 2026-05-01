import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { StarDisplay } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/Badge";
import { LikeButton } from "@/components/social/LikeButton";
import { CommentSection } from "@/components/social/CommentSection";
import { formatDistanceToNow } from "@/components/social/dateUtils";
import { getNutriScoreColor, getNutriScoreLabel } from "@/lib/openfoodfacts/client";
import { computeImgUrl } from "@/lib/compute-img-url";
import { ProductImage } from "@/components/ui/ProductImage";
import { Pencil, MessageCircle } from "lucide-react";
import type { Profile, Comment, Review } from "@/types/database";

interface ReviewDetailPageProps {
  params: Promise<{ id: string }>;
}

type CommentWithProfile = Comment & { profiles: Profile };

interface ReviewFull extends Review {
  profiles: Profile;
  review_likes: { user_id: string }[];
}

interface ProductCache {
  categories_tags: string[] | null;
  nutriscore_grade: string | null;
  nova_group: number | null;
  energy_kcal_100g: number | null;
  proteins_100g: number | null;
  carbohydrates_100g: number | null;
  fat_100g: number | null;
}

const NUTRITION = [
  { key: "energy_kcal_100g", label: "Calories", unit: "kcal" },
  { key: "proteins_100g", label: "Protein", unit: "g" },
  { key: "carbohydrates_100g", label: "Carbs", unit: "g" },
  { key: "fat_100g", label: "Fat", unit: "g" },
] as const;

export default async function ReviewDetailPage({
  params,
}: ReviewDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: rawReview }, { data: rawComments }] = await Promise.all([
    supabase
      .from("reviews")
      .select("*, profiles!user_id(*), review_likes(user_id)")
      .eq("id", id)
      .single(),
    supabase
      .from("comments")
      .select("*, profiles!user_id(*)")
      .eq("review_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!rawReview) notFound();

  const review = rawReview as unknown as ReviewFull;
  const profile = review.profiles;
  const likes = review.review_likes ?? [];
  const likeCount = likes.length;
  const liked = user ? likes.some((l) => l.user_id === user.id) : false;
  const isOwner = user?.id === review.user_id;
  const comments = (rawComments ?? []) as unknown as CommentWithProfile[];
  const commentCount = comments.length;

  // Pull richer product details from the local cache populated when snack pages are viewed
  const { data: product } = (await supabase
    .from("products")
    .select(
      "categories_tags, nutriscore_grade, nova_group, energy_kcal_100g, proteins_100g, carbohydrates_100g, fat_100g",
    )
    .eq("barcode", review.product_barcode)
    .maybeSingle()) as { data: ProductCache | null };

  let currentUserProfile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    currentUserProfile = data;
  }

  const categories =
    product?.categories_tags
      ?.filter((c) => c.startsWith("en:"))
      .map((c) => c.replace("en:", "").replace(/-/g, " "))
      .slice(0, 4) ?? [];

  const nutrition = NUTRITION.map((n) => ({
    ...n,
    value: product?.[n.key] ?? null,
  })).filter((n) => n.value != null);

  const imageUrl = computeImgUrl(review.product_barcode);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Hero: product details + reviewer merged */}
      <div
        className="neo-card overflow-hidden mb-6"
        style={{ boxShadow: "5px 5px 0 var(--border)" }}
      >
        {/* Product strip */}
        <div className="flex">
          {/* Product image — fixed-width left column */}
          <Link
            href={`/snack/${review.product_barcode}`}
            className="w-28 sm:w-36 shrink-0 relative self-stretch bg-[color:var(--muted)] border-r-2 border-[color:var(--border)] hover:opacity-90 transition-opacity"
            style={{ minHeight: 140 }}
          >
            <ProductImage
              src={imageUrl}
              alt={review.product_name}
              fill
              className="object-contain p-3"
              sizes="144px"
            />
          </Link>

          {/* Product info + reviewer */}
          <div className="flex-1 p-4 flex flex-col gap-3 min-w-0">
            {/* Product name + brand */}
            <div>
              {review.product_brand && (
                <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--text-muted)] mb-0.5">
                  {review.product_brand}
                </p>
              )}
              <Link
                href={`/snack/${review.product_barcode}`}
                className="font-black text-lg leading-tight hover:text-primary transition-colors line-clamp-2 block"
              >
                {review.product_name}
              </Link>
            </div>

            {/* Badges: nutriscore + categories */}
            {(product?.nutriscore_grade || categories.length > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {product?.nutriscore_grade && (
                  <span
                    className={`${getNutriScoreColor(product.nutriscore_grade)} text-white text-xs font-black w-6 h-6 flex items-center justify-center border-2 border-[color:var(--border)] uppercase shrink-0`}
                    title="Nutri-Score"
                  >
                    {getNutriScoreLabel(product.nutriscore_grade)}
                  </span>
                )}
                {categories.map((cat) => (
                  <Badge key={cat} variant="muted" className="text-[10px]">
                    {cat}
                  </Badge>
                ))}
              </div>
            )}

            {/* Nutrition mini row */}
            {nutrition.length > 0 && (
              <div className="flex gap-2">
                {nutrition.map((n) => (
                  <div key={n.key} className="text-center">
                    <p className="text-[10px] uppercase tracking-wide text-[color:var(--text-muted)] leading-none">
                      {n.label}
                    </p>
                    <p className="text-xs font-black leading-snug">
                      {Math.round(n.value!)}
                      <span className="font-normal text-[10px]"> {n.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Divider */}
            <div className="border-t-2 border-[color:var(--muted)]" />

            {/* Reviewer row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Link
                  href={`/profile/${profile.username}`}
                  className="shrink-0"
                >
                  <Avatar
                    src={profile.avatar_url}
                    name={profile.display_name || profile.username}
                    size="sm"
                  />
                </Link>
                <div className="min-w-0">
                  <Link
                    href={`/profile/${profile.username}`}
                    className="font-bold text-sm hover:text-primary transition-colors block truncate"
                  >
                    {profile.display_name || profile.username}
                  </Link>
                  <p className="text-xs text-[color:var(--text-muted)] leading-none">
                    {formatDistanceToNow(review.created_at)}
                    {review.updated_at !== review.created_at && " · edited"}
                  </p>
                </div>
              </div>

              {isOwner && (
                <Link
                  href={`/snack/${review.product_barcode}/review`}
                  className="neo-btn bg-[color:var(--surface)] px-3 py-1.5 text-xs flex items-center gap-1.5 shrink-0"
                >
                  <Pencil size={11} />
                  Edit
                </Link>
              )}
            </div>

            {/* Stars */}
            {review.rating != null && (
              <StarDisplay rating={review.rating} size="md" />
            )}
          </div>
        </div>

        {/* Review body */}
        {review.body && (
          <div className="px-4 py-4 border-t-2 border-[color:var(--border)]">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {review.body}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 py-3 border-t border-[color:var(--muted)] flex items-center gap-5">
          <LikeButton
            reviewId={review.id}
            initialLiked={liked}
            initialCount={likeCount}
            userId={user?.id}
          />
          <Link
            href="#comments"
            className="flex items-center gap-1.5 text-sm text-[color:var(--text-muted)] hover:text-primary transition-colors"
          >
            <MessageCircle size={15} />
            <span>{commentCount}</span>
          </Link>
        </div>
      </div>

      {/* Comments */}
      <CommentSection
        reviewId={review.id}
        reviewOwnerId={review.user_id}
        comments={comments}
        currentUser={currentUserProfile}
      />
    </div>
  );
}
