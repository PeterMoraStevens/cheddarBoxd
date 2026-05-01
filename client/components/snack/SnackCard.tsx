import Link from "next/link";
import type { OFFSearchProduct } from "@/lib/openfoodfacts/client";
import { Star } from "lucide-react";
import { computeImgUrl } from "@/lib/compute-img-url";
import { ProductImage } from "@/components/ui/ProductImage";

interface SnackCardProps {
  product: OFFSearchProduct;
  avgRating?: number | null;
  reviewCount?: number;
}

export function SnackCard({
  product,
  avgRating,
  reviewCount,
}: SnackCardProps) {
  const imageUrl = computeImgUrl(product.code);

  return (
    <Link href={`/snack/${product.code}`} className="block">
      <div className="neo-card-hover flex flex-col h-full">
        {/* Image */}
        <div className="relative aspect-square bg-[color:var(--muted)] overflow-hidden border-b-2 border-[color:var(--border)]">
          <ProductImage
            src={imageUrl}
            alt={product.product_name || "Snack"}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          {/* Rating badge */}
          {avgRating !== undefined && (
            <div className="absolute top-2 right-2 bg-[color:var(--surface)] border-2 border-[color:var(--border)] px-1.5 h-7 flex items-center gap-0.5 text-xs font-black">
              {avgRating != null ? (
                <>
                  <Star size={10} className="text-primary" fill="currentColor" />
                  <span>{avgRating.toFixed(1)}</span>
                </>
              ) : (
                <span className="text-[color:var(--text-muted)]">?</span>
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col gap-1 flex-1">
          <h3 className="font-bold text-sm leading-tight text-[color:var(--text)] line-clamp-2">
            {product.product_name || "Unknown Product"}
          </h3>
          {product.brands && (
            <p className="text-xs text-[color:var(--text-muted)] uppercase tracking-wide font-medium truncate">
              {product.brands.split(",")[0].trim()}
            </p>
          )}
          {product.quantity && (
            <p className="text-xs text-[color:var(--text-muted)]">
              {product.quantity}
            </p>
          )}

          {/* Review count */}
          {reviewCount != null && reviewCount > 0 && (
            <div className="mt-auto pt-2 flex items-center gap-1 text-[color:var(--text-muted)]">
              <span className="text-xs">{reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
