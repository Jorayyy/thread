"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCallback, useState } from "react";
import { Search } from "lucide-react";

interface ProductFiltersProps {
  categories: { name: string; slug: string }[];
  activeCategory?: string;
}

export function ProductFilters({ categories, activeCategory }: ProductFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`${pathname}?${createQueryString("search", searchValue)}`);
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>
      </form>

      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Categories
        </h3>
        <ul className="mt-4 space-y-2">
          <li>
            <Link
              href="/products"
              className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                !activeCategory
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              All Products
            </Link>
          </li>
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/products?category=${category.slug}`}
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  activeCategory === category.slug
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Price Range
        </h3>
        <ul className="mt-4 space-y-2">
          {[
            { label: "Under ₱500", min: "", max: "500" },
            { label: "₱500 - ₱1,000", min: "500", max: "1000" },
            { label: "₱1,000 - ₱2,000", min: "1000", max: "2000" },
            { label: "₱2,000+", min: "2000", max: "" },
          ].map((range) => (
            <li key={range.label}>
              <Link
                href={`/products?${new URLSearchParams({
                  ...(searchParams.get("category") ? { category: searchParams.get("category")! } : {}),
                  ...(range.min ? { minPrice: range.min } : {}),
                  ...(range.max ? { maxPrice: range.max } : {}),
                }).toString()}`}
                className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {range.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
