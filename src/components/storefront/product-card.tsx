"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    slug: string;
    basePrice: number;
    images?: { url: string; alt?: string }[];
    variants?: { price: number; stock: number }[];
    category?: { name: string };
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const minPrice = product.variants?.length
    ? Math.min(...product.variants.map((v) => Number(v.price)))
    : Number(product.basePrice);

  const hasStock = product.variants?.some((v) => v.stock > 0) ?? true;

  return (
    <div className="group relative">
      <Link href={`/products/${product.slug}`}>
        <div className="aspect-square overflow-hidden rounded-lg bg-secondary">
          {product.images?.[0]?.url ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt || product.name}
              width={400}
              height={400}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
        </div>
      </Link>

      {/* Actions */}
      <div className="absolute right-2 top-2 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Button size="icon" variant="secondary" className="h-8 w-8">
          <Heart className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" className="h-8 w-8">
          <ShoppingBag className="h-4 w-4" />
        </Button>
      </div>

      {/* Info */}
      <div className="mt-4 space-y-1">
        {product.category && (
          <p className="text-xs text-muted-foreground">{product.category.name}</p>
        )}
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-medium line-clamp-1 hover:underline">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{formatPrice(minPrice)}</p>
          {!hasStock && (
            <span className="text-xs text-destructive">Out of Stock</span>
          )}
        </div>
      </div>
    </div>
  );
}
