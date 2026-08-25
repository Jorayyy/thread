import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { categories, products, productImages } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";
import { ProductCard } from "@/components/storefront/product-card";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const categoryData = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  if (!categoryData.length) notFound();

  const category = categoryData[0];

  const categoryProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      basePrice: products.basePrice,
      categoryName: categories.name,
      imageUrl: productImages.url,
      imageAlt: productImages.alt,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productImages, eq(productImages.productId, products.id))
    .where(eq(products.categoryId, category.id))
    .orderBy(desc(products.createdAt));

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
            <a href="/categories" className="hover:text-foreground">Categories</a>
          </li>
          <li>/</li>
          <li className="text-foreground">{category.name}</li>
        </ol>
      </nav>

      {/* Category Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            {category.description}
          </p>
        )}
      </div>

      {/* Products */}
      {categoryProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No products in this category yet
          </p>
          <Link
            href="/products"
            className="mt-4 text-sm font-medium text-accent hover:underline"
          >
            Browse all products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {categoryProducts.map((product) => (
            <ProductCard key={product.id} product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              basePrice: Number(product.basePrice),
              images: product.imageUrl ? [{ url: product.imageUrl, alt: product.imageAlt || undefined }] : [],
              category: product.categoryName ? { name: product.categoryName } : undefined,
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
