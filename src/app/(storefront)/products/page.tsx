import { db } from "@/db";
import { products, categories, productImages, productVariants } from "@/db/schema";
import { eq, desc, asc, and, like, sql } from "drizzle-orm";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductFilters } from "./product-filters";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const categorySlug = typeof params.category === "string" ? params.category : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;
  const sort = typeof params.sort === "string" ? params.sort : "newest";
  const minPrice = typeof params.minPrice === "string" ? Number(params.minPrice) : undefined;
  const maxPrice = typeof params.maxPrice === "string" ? Number(params.maxPrice) : undefined;

  const allCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.name));

  const selectedCategory = categorySlug
    ? allCategories.find((c) => c.slug === categorySlug)
    : undefined;

  const conditions = [eq(products.isActive, true)];

  if (selectedCategory) {
    conditions.push(eq(products.categoryId, selectedCategory.id));
  }
  if (search) {
    conditions.push(like(products.name, `%${search}%`));
  }

  let orderByClause;
  switch (sort) {
    case "price-low":
      orderByClause = asc(products.basePrice);
      break;
    case "price-high":
      orderByClause = desc(products.basePrice);
      break;
    case "newest":
    default:
      orderByClause = desc(products.createdAt);
      break;
  }

  let fetchedProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      basePrice: products.basePrice,
      categoryId: products.categoryId,
      categoryName: categories.name,
      imageUrl: productImages.url,
      imageAlt: productImages.alt,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productImages, eq(productImages.productId, products.id))
    .where(and(...conditions))
    .orderBy(orderByClause);

  if (minPrice !== undefined || maxPrice !== undefined) {
    fetchedProducts = fetchedProducts.filter((p) => {
      const price = Number(p.basePrice);
      if (minPrice !== undefined && price < minPrice) return false;
      if (maxPrice !== undefined && price > maxPrice) return false;
      return true;
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {selectedCategory ? selectedCategory.name : "All Products"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {fetchedProducts.length} product{fetchedProducts.length !== 1 ? "s" : ""} found
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0">
          <ProductFilters
            categories={allCategories.map((c) => ({ name: c.name, slug: c.slug }))}
            activeCategory={categorySlug}
          />
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Sort by:</span>
              <select
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                defaultValue={sort}
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {fetchedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-lg font-medium text-muted-foreground">No products found</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              {fetchedProducts.map((product) => (
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
      </div>
    </div>
  );
}
