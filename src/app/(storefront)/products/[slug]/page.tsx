import { notFound } from "next/navigation";
import { db } from "@/db";
import { products, categories, productVariants, productImages, reviews, users } from "@/db/schema";
import { eq, desc, and, ne, sql, asc } from "drizzle-orm";
import { formatPrice, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
import { ProductDetailClient } from "./product-detail-client";
import { ProductCard } from "@/components/storefront/product-card";
import { Star } from "lucide-react";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const productData = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      shortDescription: products.shortDescription,
      basePrice: products.basePrice,
      categoryId: products.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .limit(1);

  if (!productData.length) notFound();

  const product = productData[0];

  const productImagesData = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(asc(productImages.sortOrder));

  const productVariantsData = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, product.id));

  const productReviewsData = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      title: reviews.title,
      comment: reviews.comment,
      isVerified: reviews.isVerified,
      createdAt: reviews.createdAt,
      userName: users.name,
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.productId, product.id))
    .orderBy(desc(reviews.createdAt));

  const avgRating = productReviewsData.length
    ? productReviewsData.reduce((sum, r) => sum + (r.rating || 0), 0) / productReviewsData.length
    : 0;

  const relatedProductsData = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      basePrice: products.basePrice,
      categoryName: categories.name,
      imageUrl: productImages.url,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productImages, eq(productImages.productId, products.id))
    .where(and(eq(products.categoryId, product.categoryId), ne(products.id, product.id)))
    .limit(4);

  const uniqueSizes = [...new Set(productVariantsData.map((v) => v.size).filter(Boolean))] as string[];
  const uniqueColors = [
    ...new Map(
      productVariantsData
        .filter((v) => v.color)
        .map((v) => [v.color, { color: v.color!, colorHex: v.colorHex || "#888" }])
    ).values(),
  ];

  const primaryImage = productImagesData.find((img) => img.isPrimary) || productImagesData[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-muted-foreground">
        <ol className="flex items-center gap-2">
          <li>
            <a href="/" className="hover:text-foreground">Home</a>
          </li>
          <li>/</li>
          <li>
            <a href="/products" className="hover:text-foreground">Products</a>
          </li>
          <li>/</li>
          <li>
            <a href={`/products?category=${product.categorySlug}`} className="hover:text-foreground">
              {product.categoryName}
            </a>
          </li>
          <li>/</li>
          <li className="text-foreground">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-lg bg-secondary">
            {primaryImage ? (
              <img
                src={primaryImage.url}
                alt={primaryImage.alt || product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
          </div>
          {productImagesData.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {productImagesData.map((image) => (
                <div
                  key={image.id}
                  className="aspect-square overflow-hidden rounded-md border-2 border-transparent bg-secondary transition-colors hover:border-accent"
                >
                  <img
                    src={image.url}
                    alt={image.alt || product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">{product.categoryName}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{product.name}</h1>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(avgRating)
                        ? "fill-accent text-accent"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {productReviewsData.length} review{productReviewsData.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <p className="text-2xl font-bold">{formatPrice(Number(product.basePrice))}</p>

          {product.shortDescription && (
            <p className="text-muted-foreground">{product.shortDescription}</p>
          )}

          <ProductDetailClient
            productId={product.id}
            sizes={uniqueSizes}
            colors={uniqueColors}
            variants={productVariantsData.map((v) => ({
              id: v.id,
              size: v.size ?? undefined,
              color: v.color ?? undefined,
              price: Number(v.price),
              stock: v.stock,
            }))}
            basePrice={Number(product.basePrice)}
          />
        </div>
      </div>

      {/* Tabs - Description & Reviews */}
      <div className="mt-16">
        <div className="border-b">
          <div className="flex gap-8">
            <button className="border-b-2 border-accent pb-4 text-sm font-semibold">
              Description
            </button>
            <button className="border-b-2 border-transparent pb-4 text-sm font-medium text-muted-foreground">
              Reviews ({productReviewsData.length})
            </button>
          </div>
        </div>

        <div className="py-8">
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap text-muted-foreground">
              {product.description || "No description available."}
            </p>
          </div>
        </div>

        {/* Reviews */}
        {productReviewsData.length > 0 && (
          <div className="space-y-6">
            {productReviewsData.map((review) => (
              <div key={review.id} className="rounded-lg border p-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= (review.rating || 0)
                            ? "fill-accent text-accent"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{review.userName || "Anonymous"}</span>
                  <span className="text-xs text-muted-foreground">
                    {review.createdAt ? formatDate(review.createdAt) : ""}
                  </span>
                  {review.isVerified && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      Verified Purchase
                    </span>
                  )}
                </div>
                {review.title && (
                  <h4 className="mt-3 font-semibold">{review.title}</h4>
                )}
                {review.comment && (
                  <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProductsData.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight">You May Also Like</h2>
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProductsData.map((p) => (
              <ProductCard key={p.id} product={{
                id: p.id,
                name: p.name,
                slug: p.slug,
                basePrice: Number(p.basePrice),
                images: p.imageUrl ? [{ url: p.imageUrl }] : [],
                category: p.categoryName ? { name: p.categoryName } : undefined,
              }} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
