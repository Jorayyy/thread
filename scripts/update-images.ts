import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const updates = [
  { slug: "classic-linen-shirt", url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=800&fit=crop", url2: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=800&fit=crop" },
  { slug: "organic-cotton-tee", url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop", url2: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=800&fit=crop" },
  { slug: "slim-chino-pants", url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=800&fit=crop", url2: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=800&fit=crop" },
  { slug: "relaxed-denim-jeans", url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=800&fit=crop", url2: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=800&fit=crop" },
  { slug: "floral-wrap-dress", url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&h=800&fit=crop", url2: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop" },
  { slug: "canvas-utility-jacket", url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=800&fit=crop", url2: "https://images.unsplash.com/photo-1520975954732-35dd22299614?w=600&h=800&fit=crop" },
  { slug: "fleece-zip-hoodie", url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=800&fit=crop", url2: "https://images.unsplash.com/photo-1578768079470-4e33ba4545e5?w=600&h=800&fit=crop" },
  { slug: "woven-straw-tote", url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=800&fit=crop", url2: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&h=800&fit=crop" },
  { slug: "ribbed-knit-midi-dress", url: "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&h=800&fit=crop", url2: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600&h=800&fit=crop" },
  { slug: "pleated-wide-leg-trousers", url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop", url2: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&h=800&fit=crop" },
];

async function main() {
  for (const item of updates) {
    const result = await sql`SELECT id FROM products WHERE slug = ${item.slug}`;
    if (result.length === 0) {
      console.log("Skipped:", item.slug);
      continue;
    }
    const productId = (result[0] as any).id;

    await sql`DELETE FROM product_images WHERE product_id = ${productId}`;
    await sql`INSERT INTO product_images (product_id, url, alt, sort_order, is_primary) VALUES (${productId}, ${item.url}, 'Product image 1', 0, true)`;
    await sql`INSERT INTO product_images (product_id, url, alt, sort_order, is_primary) VALUES (${productId}, ${item.url2}, 'Product image 2', 1, false)`;

    console.log("Updated:", item.slug);
  }
  console.log("Done!");
}

main().catch((err) => { console.error(err); process.exit(1); });
