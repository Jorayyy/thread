import Link from "next/link";
import { db } from "@/db";
import { products, categories, productImages } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Truck, Shield, RotateCcw, Headphones } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featuredProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      basePrice: products.basePrice,
      isFeatured: products.isFeatured,
      categoryName: categories.name,
      imageUrl: productImages.url,
      imageAlt: productImages.alt,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productImages, eq(productImages.productId, products.id))
    .where(eq(products.isFeatured, true))
    .limit(8);

  const allCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.name));

  const benefits = [
    { icon: Truck, title: "Free Shipping", description: "On orders over ₱2,000" },
    { icon: Shield, title: "Secure Payments", description: "100% secure checkout" },
    { icon: RotateCcw, title: "Easy Returns", description: "30-day return policy" },
    { icon: Headphones, title: "24/7 Support", description: "We're here to help" },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Premium Clothing for the Modern Wardrobe
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Discover curated collections that blend comfort with contemporary style.
              Quality craftsmanship meets effortless design.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link href="/products">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Shop Now
                </Button>
              </Link>
              <Link href="/categories">
                <Button size="lg" className="bg-white/10 text-white border border-white/30 hover:bg-white/20">
                  Browse Categories
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-accent/20 to-transparent" />
      </section>

      {/* Categories Grid */}
      {allCategories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Shop by Category</h2>
            <Link href="/categories" className="text-sm font-medium text-accent hover:underline">
              View All
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {allCategories.slice(0, 4).map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-secondary"
              >
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary to-muted">
                    <span className="text-lg font-semibold text-muted-foreground">{category.name}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-end p-4">
                  <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Featured Products</h2>
            <Link href="/products" className="text-sm font-medium text-accent hover:underline">
              View All
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group relative"
              >
                <div className="aspect-square overflow-hidden rounded-lg bg-secondary">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.imageAlt || product.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground">{product.categoryName}</p>
                  <h3 className="text-sm font-medium line-clamp-1">{product.name}</h3>
                  <p className="text-sm font-semibold">{formatPrice(Number(product.basePrice))}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="bg-secondary">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold tracking-tight">Why Choose ThreadCraft</h2>
          <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <benefit.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mt-4 text-sm font-semibold">{benefit.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
