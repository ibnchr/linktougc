"use client";

import * as React from "react";
import { Star, ShoppingBag, Image as ImageIcon, AlertCircle } from "lucide-react";

import { cn, formatRupiah, getImageUrl } from "@/lib/utils";
import type { ProductInfo } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface ProductPreviewProps {
  product: ProductInfo | null;
  className?: string;
}

function ImagePlaceholder() {
  return (
    <div className="flex aspect-square items-center justify-center rounded-lg bg-muted">
      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
    </div>
  );
}

function GalleryImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "group relative aspect-square overflow-hidden rounded-lg border bg-muted transition-all hover:ring-2 hover:ring-primary",
          )}
        >
          {!loaded && !error && <Skeleton className="absolute inset-0" />}
          {error ? (
            <ImagePlaceholder />
          ) : (
            <img
              src={getImageUrl(src)}
              alt={alt}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              onError={() => setError(true)}
              className={cn(
                "h-full w-full object-cover transition-all duration-300 group-hover:scale-105",
                loaded ? "opacity-100" : "opacity-0",
              )}
            />
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
        <div className="flex items-center justify-center">
          {error ? (
            <ImagePlaceholder />
          ) : (
            <img
              src={getImageUrl(src)}
              alt={alt}
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProductSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-8 w-1/3" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductPreview({ product, className }: ProductPreviewProps) {
  if (!product) {
    return <ProductSkeleton />;
  }

  const platformConfig =
    product.platform === "shopee"
      ? { label: "Shopee", class: "bg-orange-500/15 text-orange-600 dark:text-orange-400" }
      : { label: "TikTok", class: "bg-pink-500/15 text-pink-600 dark:text-pink-400" };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="line-clamp-2 text-lg font-semibold leading-tight tracking-tight">
              {product.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">
                {formatRupiah(product.price)}
              </span>
              {product.priceOriginal && product.priceOriginal > product.price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatRupiah(product.priceOriginal)}
                </span>
              )}
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "mt-1 shrink-0 border-none text-xs font-semibold uppercase tracking-wider",
              platformConfig.class,
            )}
          >
            {platformConfig.label}
          </Badge>
        </div>

        {(product.rating !== undefined || product.sold !== undefined) && (
          <div className="flex flex-wrap items-center gap-3">
            {product.rating !== undefined && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
              </div>
            )}
            {product.sold !== undefined && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <ShoppingBag className="h-3.5 w-3.5" />
                <span className="text-sm">
                  {product.sold >= 1000
                    ? `${(product.sold / 1000).toFixed(1)}rb`
                    : product.sold}{" "}
                  terjual
                </span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {product.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {product.images.map((image, i) => (
              <GalleryImage key={i} src={image} alt={`${product.title} - Gambar ${i + 1}`} />
            ))}
          </div>
        )}

        {product.description && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
