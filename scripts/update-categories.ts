import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const categoryImages: Record<string, string> = {
  "tops": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=600&fit=crop",
  "bottoms": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=600&fit=crop",
  "dresses": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=600&fit=crop",
  "outerwear": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=600&fit=crop",
  "accessories": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop",
};

async function main() {
  for (const [slug, url] of Object.entries(categoryImages)) {
    await sql`UPDATE categories SET image = ${url} WHERE slug = ${slug}`;
    console.log("Updated category:", slug);
  }
  console.log("Done!");
}

main().catch((err) => { console.error(err); process.exit(1); });
