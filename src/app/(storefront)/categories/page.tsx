import Link from "next/link";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { eq, asc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      image: categories.image,
      isActive: categories.isActive,
    })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.name));

  const categoryCounts = await db
    .select({
      categoryId: products.categoryId,
      count: sql<number>`count(*)::int`,
    })
    .from(products)
    .groupBy(products.categoryId);

  const countMap = new Map(categoryCounts.map((c) => [c.categoryId, c.count]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="mt-2 text-muted-foreground">
          Browse our curated collections
        </p>
      </div>

      {allCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-muted-foreground">No categories available</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Check back soon for new collections
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {allCategories.map((category) => {
            const productCount = countMap.get(category.id) || 0;
            return (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="aspect-[16/9] overflow-hidden bg-secondary">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary to-muted">
                      <span className="text-4xl font-bold text-muted-foreground/30">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h2 className="text-lg font-semibold group-hover:text-accent transition-colors">
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  <p className="mt-4 text-sm text-muted-foreground">
                    {productCount} product{productCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
