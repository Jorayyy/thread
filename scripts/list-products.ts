import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const products = await sql`SELECT id, name, slug FROM products ORDER BY id`;
  console.log("Products in database:");
  for (const p of products) {
    console.log(`  ${(p as any).id}: ${(p as any).slug} - ${(p as any).name}`);
  }
}

main();
