import { createClient } from "@/lib/supabase/server";
import { getNutriScoreColor, getNutriScoreLabel } from "@/lib/openfoodfacts/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewCard } from "@/components/social/ReviewCard";
import { StarDisplay } from "@/components/ui/StarRating";
import { RatingChart } from "@/components/profile/RatingChart";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProductImage } from "@/components/ui/ProductImage";
import { BackButton } from "@/components/ui/BackButton";
import { Pencil, Plus } from "lucide-react";
import type { ReviewWithProfile } from "@/types/database";
import type { Database } from "@/types/database";
import { computeImgUrl } from "@/lib/compute-img-url";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

interface SnackPageProps {
  params: Promise<{ barcode: string }>;
}

export default async function SnackPage({ params }: SnackPageProps) {
  const { barcode } = await params;
  const supabase = await createClient();

  const [
    { data: rawProduct },
    {
      data: { user },
    },
    { data: ratingRows },
  ] = await Promise.all([
    supabase.from("products").select("*").eq("barcode", barcode).single(),
    supabase.auth.getUser(),
    // Query ALL ratings for this product (no limit) for accurate stats
    supabase
      .from("reviews")
      .select("rating")
      .eq("product_barcode", barcode)
      .eq("is_public", true)
      .not("rating", "is", null),
  ]);

  const product = rawProduct as ProductRow | null;
  if (!product) notFound();

  // Reviews for display (limited to 20)
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, profiles!reviews_user_id_fkey(*), review_likes(user_id), comments(id)")
    .eq("product_barcode", barcode)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(20);

  const typedReviews = (reviews ?? []) as ReviewWithProfile[];

  // Aggregate ratings from ALL reviews (not just the 20 displayed)
  const allRatings = (ratingRows ?? [])
    .map((r) => r.rating)
    .filter((r): r is number => r != null);

  const avgRating = allRatings.length
    ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
    : null;

  // Rating distribution by star (1–5)
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: allRatings.filter((r) => Math.round(r) === star).length,
  }));

  // Current user's review
  let userReview: ReviewWithProfile | null = null;
  if (user) {
    userReview = typedReviews.find((r) => r.user_id === user.id) ?? null;
  }

  const categories =
    product.categories_tags
      ?.filter((c) => c.startsWith("en:"))
      .map((c) => c.replace("en:", "").replace(/-/g, " "))
      .slice(0, 4) ?? [];

  const nutrition = [
    { label: "Calories", value: product.energy_kcal_100g, unit: "kcal" },
    { label: "Protein", value: product.proteins_100g, unit: "g" },
    { label: "Carbs", value: product.carbohydrates_100g, unit: "g" },
    { label: "Fat", value: product.fat_100g, unit: "g" },
  ].filter((n) => n.value != null);

  const imageUrl = computeImgUrl(barcode);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-4">
        <BackButton label="Back" />
      </div>

      {/* Product header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Image */}
        <div className="md:col-span-1">
          <div className="neo-card aspect-square overflow-hidden relative">
            <ProductImage
              src={imageUrl}
              alt={product.name}
              fill
              className="object-contain p-6"
              sizes="(max-width: 768px) 100vw, 33vw"
              priority
            />
          </div>
        </div>

        {/* Info */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div>
            {product.brand && (
              <p className="text-sm font-bold uppercase tracking-widest text-[color:var(--text-muted)] mb-1">
                {product.brand}
              </p>
            )}
            <h1 className="text-4xl font-black tracking-tight leading-tight mb-2">
              {product.name}
            </h1>
            {product.quantity && (
              <p className="text-sm text-[color:var(--text-muted)]">
                {product.quantity}
              </p>
            )}
          </div>

          {/* Rating summary */}
          <div className="flex items-start gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              {avgRating != null ? (
                <>
                  <span className="text-4xl font-black tabular-nums">
                    {avgRating.toFixed(1)}
                  </span>
                  <div>
                    <StarDisplay rating={avgRating} size="lg" />
                    <p className="text-xs text-[color:var(--text-muted)] mt-0.5">
                      {allRatings.length} rating{allRatings.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </>
              ) : (
                <span className="text-sm text-[color:var(--text-muted)]">
                  No reviews yet — be the first!
                </span>
              )}
            </div>
            {allRatings.length > 0 && <RatingChart ratings={allRatings} compact />}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {user ? (
              <Link href={`/snack/${barcode}/review`}>
                <Button
                  variant="primary"
                  size="md"
                  className="flex items-center gap-2"
                >
                  {userReview ? (
                    <>
                      <Pencil size={14} /> Edit review
                    </>
                  ) : (
                    <>
                      <Plus size={14} /> Write a review
                    </>
                  )}
                </Button>
              </Link>
            ) : (
              <Link href="/auth/login">
                <Button variant="primary" size="md">
                  Sign in to review
                </Button>
              </Link>
            )}
          </div>

          {/* Badges */}
          {(product.nutriscore_grade ||
            product.nova_group ||
            categories.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {product.nutriscore_grade && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-[color:var(--text-muted)]">
                    Nutri-Score
                  </span>
                  <span
                    className={`${getNutriScoreColor(product.nutriscore_grade)} text-white text-sm font-black w-8 h-8 flex items-center justify-center border-2 border-[color:var(--border)] uppercase`}
                  >
                    {getNutriScoreLabel(product.nutriscore_grade)}
                  </span>
                </div>
              )}
              {product.nova_group && (
                <Badge variant="muted">NOVA {product.nova_group}</Badge>
              )}
              {categories.map((cat) => (
                <Badge key={cat} variant="muted">
                  {cat}
                </Badge>
              ))}
            </div>
          )}

          {/* Nutrition */}
          {nutrition.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {nutrition.map((n) => (
                <div key={n.label} className="neo-card p-3 text-center">
                  <p className="text-xs uppercase tracking-wide text-[color:var(--text-muted)] mb-1">
                    {n.label}
                  </p>
                  <p className="font-black text-lg">{Math.round(n.value!)}</p>
                  <p className="text-xs text-[color:var(--text-muted)]">
                    {n.unit}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full rating distribution */}
      {allRatings.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-black uppercase tracking-tight mb-4 border-b-2 border-[color:var(--border)] pb-3">
            Rating Distribution
          </h2>
          <div className="max-w-md">
            <div className="neo-card p-5">
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-5xl font-black tabular-nums">
                  {avgRating!.toFixed(1)}
                </span>
                <div>
                  <StarDisplay rating={avgRating!} size="lg" />
                  <p className="text-xs text-[color:var(--text-muted)] mt-0.5">
                    Average of {allRatings.length} rating{allRatings.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {distribution.map(({ star, count }) => {
                  const maxCount = Math.max(...distribution.map((d) => d.count), 1);
                  const pct = (count / maxCount) * 100;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs font-bold w-4 text-right text-[color:var(--text-muted)]">
                        {star}
                      </span>
                      <span className="text-primary text-xs leading-none">★</span>
                      <div className="flex-1 h-4 bg-[color:var(--muted)] border border-[color:var(--border)] overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-[color:var(--text-muted)] w-6 text-right tabular-nums">
                        {count > 0 ? count : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews */}
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tight mb-6 border-b-2 border-[color:var(--border)] pb-3">
          Reviews
        </h2>
        {typedReviews.length === 0 ? (
          <div className="neo-card p-8 text-center">
            <p className="text-[color:var(--text-muted)] text-sm">
              No reviews yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {typedReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                showSnack={false}
                currentUserId={user?.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
