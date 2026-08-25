"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Minus, Plus } from "lucide-react";

interface ProductDetailClientProps {
  productId: number;
  sizes: (string | undefined)[];
  colors: { color: string; colorHex: string }[];
  variants: {
    id: number;
    size: string | undefined;
    color: string | undefined;
    price: number;
    stock: number;
  }[];
  basePrice: number;
}

export function ProductDetailClient({
  productId,
  sizes,
  colors,
  variants,
  basePrice,
}: ProductDetailClientProps) {
  const [selectedSize, setSelectedSize] = useState<string | undefined>(sizes[0]);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(colors[0]?.color);
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = variants.find(
    (v) =>
      v.size === selectedSize &&
      v.color === selectedColor
  );

  const currentPrice = selectedVariant?.price ?? basePrice;
  const inStock = selectedVariant ? selectedVariant.stock > 0 : false;
  const stockCount = selectedVariant?.stock ?? 0;

  return (
    <div className="space-y-6">
      {/* Size Selection */}
      {sizes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold">Size</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedSize === size
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-input hover:border-accent"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Selection */}
      {colors.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold">
            Color: <span className="font-normal text-muted-foreground">{selectedColor}</span>
          </h3>
          <div className="mt-3 flex gap-3">
            {colors.map((c) => (
              <button
                key={c.color}
                onClick={() => setSelectedColor(c.color)}
                className={`h-8 w-8 rounded-full border-2 transition-all ${
                  selectedColor === c.color
                    ? "border-accent ring-2 ring-accent ring-offset-2"
                    : "border-transparent hover:border-muted-foreground"
                }`}
                style={{ backgroundColor: c.colorHex }}
                title={c.color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Price */}
      <div>
        <span className="text-2xl font-bold">{formatPrice(currentPrice)}</span>
        {selectedVariant && currentPrice < basePrice && (
          <span className="ml-2 text-sm text-muted-foreground line-through">
            {formatPrice(basePrice)}
          </span>
        )}
      </div>

      {/* Stock */}
      {selectedVariant && (
        <p className={`text-sm ${inStock ? "text-green-600" : "text-destructive"}`}>
          {inStock
            ? stockCount <= 5
              ? `Only ${stockCount} left in stock`
              : "In Stock"
            : "Out of Stock"}
        </p>
      )}

      {/* Quantity */}
      <div>
        <h3 className="text-sm font-semibold">Quantity</h3>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center rounded-md border">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[3rem] text-center text-sm font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(stockCount || 10, quantity + 1))}
              className="px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add to Cart */}
      <Button size="lg" className="w-full" disabled={!inStock}>
        <ShoppingBag className="mr-2 h-5 w-5" />
        {inStock ? "Add to Cart" : "Out of Stock"}
      </Button>
    </div>
  );
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(price);
}
