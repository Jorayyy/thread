import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL set. Skipping migration.");
    return;
  }

  const sql = neon(process.env.DATABASE_URL);
  console.log("Checking database...");

  const check = await sql.query(`SELECT count(*) as count FROM information_schema.tables WHERE table_schema = 'public'`);
  const tableCount = Number((check as any).rows[0].count);

  if (tableCount >= 16) {
    console.log(`Database already has ${tableCount} tables. Skipping.`);
    return;
  }

  console.log(`Found ${tableCount} tables. Running migration...`);

  const drops = [
    `DROP TABLE IF EXISTS "analytics_events" CASCADE`,
    `DROP TABLE IF EXISTS "messages" CASCADE`,
    `DROP TABLE IF EXISTS "conversations" CASCADE`,
    `DROP TABLE IF EXISTS "reviews" CASCADE`,
    `DROP TABLE IF EXISTS "wishlists" CASCADE`,
    `DROP TABLE IF EXISTS "cart_items" CASCADE`,
    `DROP TABLE IF EXISTS "reservation_items" CASCADE`,
    `DROP TABLE IF EXISTS "reservations" CASCADE`,
    `DROP TABLE IF EXISTS "order_items" CASCADE`,
    `DROP TABLE IF EXISTS "orders" CASCADE`,
    `DROP TABLE IF EXISTS "inventory_logs" CASCADE`,
    `DROP TABLE IF EXISTS "product_images" CASCADE`,
    `DROP TABLE IF EXISTS "product_variants" CASCADE`,
    `DROP TABLE IF EXISTS "products" CASCADE`,
    `DROP TABLE IF EXISTS "categories" CASCADE`,
    `DROP TABLE IF EXISTS "users" CASCADE`,
  ];
  const creates = [
    `CREATE TABLE "users" ("id" serial PRIMARY KEY NOT NULL,"name" varchar(255) NOT NULL,"email" varchar(255) NOT NULL,"password_hash" text,"phone" varchar(20),"role" varchar(20) DEFAULT 'customer' NOT NULL,"image" text,"email_verified" timestamp,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now(),CONSTRAINT "users_email_unique" UNIQUE("email"))`,
    `CREATE TABLE "categories" ("id" serial PRIMARY KEY NOT NULL,"name" varchar(255) NOT NULL,"slug" varchar(255) NOT NULL,"description" text,"image" text,"parent_id" integer,"is_active" boolean DEFAULT true,"created_at" timestamp DEFAULT now(),CONSTRAINT "categories_slug_unique" UNIQUE("slug"))`,
    `CREATE TABLE "products" ("id" serial PRIMARY KEY NOT NULL,"name" varchar(255) NOT NULL,"slug" varchar(255) NOT NULL,"description" text,"short_description" varchar(500),"base_price" numeric(10, 2) NOT NULL,"category_id" integer NOT NULL,"brand" varchar(100),"is_active" boolean DEFAULT true,"is_featured" boolean DEFAULT false,"tags" text[],"metadata" jsonb,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now(),CONSTRAINT "products_slug_unique" UNIQUE("slug"))`,
    `CREATE TABLE "product_variants" ("id" serial PRIMARY KEY NOT NULL,"product_id" integer NOT NULL,"size" varchar(50),"color" varchar(50),"color_hex" varchar(7),"sku" varchar(100),"price" numeric(10, 2) NOT NULL,"compare_at_price" numeric(10, 2),"stock" integer DEFAULT 0 NOT NULL,"weight" numeric(8, 2),"is_active" boolean DEFAULT true,"created_at" timestamp DEFAULT now(),CONSTRAINT "product_variants_sku_unique" UNIQUE("sku"))`,
    `CREATE TABLE "product_images" ("id" serial PRIMARY KEY NOT NULL,"product_id" integer NOT NULL,"variant_id" integer,"url" text NOT NULL,"alt" varchar(255),"sort_order" integer DEFAULT 0,"is_primary" boolean DEFAULT false)`,
    `CREATE TABLE "orders" ("id" serial PRIMARY KEY NOT NULL,"order_number" varchar(50) NOT NULL,"user_id" integer,"guest_email" varchar(255),"guest_name" varchar(255),"guest_phone" varchar(20),"status" varchar(30) DEFAULT 'pending' NOT NULL,"subtotal" numeric(10, 2) NOT NULL,"shipping_fee" numeric(10, 2) DEFAULT '0',"discount" numeric(10, 2) DEFAULT '0',"total" numeric(10, 2) NOT NULL,"payment_method" varchar(50),"payment_status" varchar(30) DEFAULT 'unpaid',"shipping_address" jsonb,"billing_address" jsonb,"notes" text,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now(),CONSTRAINT "orders_order_number_unique" UNIQUE("order_number"))`,
    `CREATE TABLE "order_items" ("id" serial PRIMARY KEY NOT NULL,"order_id" integer NOT NULL,"product_id" integer NOT NULL,"variant_id" integer NOT NULL,"quantity" integer NOT NULL,"price" numeric(10, 2) NOT NULL,"total" numeric(10, 2) NOT NULL)`,
    `CREATE TABLE "reservations" ("id" serial PRIMARY KEY NOT NULL,"reservation_number" varchar(50) NOT NULL,"user_id" integer,"guest_email" varchar(255),"guest_name" varchar(255),"guest_phone" varchar(20),"type" varchar(30) NOT NULL,"status" varchar(30) DEFAULT 'active' NOT NULL,"expires_at" timestamp,"total_amount" numeric(10, 2) NOT NULL,"paid_amount" numeric(10, 2) DEFAULT '0',"remaining_amount" numeric(10, 2) DEFAULT '0',"appointment_date" timestamp,"appointment_notes" text,"notes" text,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now(),CONSTRAINT "reservations_reservation_number_unique" UNIQUE("reservation_number"))`,
    `CREATE TABLE "reservation_items" ("id" serial PRIMARY KEY NOT NULL,"reservation_id" integer NOT NULL,"product_id" integer NOT NULL,"variant_id" integer NOT NULL,"quantity" integer NOT NULL,"price" numeric(10, 2) NOT NULL)`,
    `CREATE TABLE "cart_items" ("id" serial PRIMARY KEY NOT NULL,"user_id" integer,"session_id" varchar(255),"product_id" integer NOT NULL,"variant_id" integer NOT NULL,"quantity" integer DEFAULT 1 NOT NULL,"created_at" timestamp DEFAULT now())`,
    `CREATE TABLE "wishlists" ("id" serial PRIMARY KEY NOT NULL,"user_id" integer NOT NULL,"product_id" integer NOT NULL,"created_at" timestamp DEFAULT now())`,
    `CREATE TABLE "reviews" ("id" serial PRIMARY KEY NOT NULL,"user_id" integer NOT NULL,"product_id" integer NOT NULL,"rating" integer NOT NULL,"title" varchar(255),"comment" text,"is_verified" boolean DEFAULT false,"created_at" timestamp DEFAULT now())`,
    `CREATE TABLE "conversations" ("id" serial PRIMARY KEY NOT NULL,"user_id" integer,"session_id" varchar(255),"mode" varchar(20) DEFAULT 'bot' NOT NULL,"status" varchar(20) DEFAULT 'active' NOT NULL,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now())`,
    `CREATE TABLE "messages" ("id" serial PRIMARY KEY NOT NULL,"conversation_id" integer NOT NULL,"role" varchar(20) NOT NULL,"content" text NOT NULL,"metadata" jsonb,"created_at" timestamp DEFAULT now())`,
    `CREATE TABLE "inventory_logs" ("id" serial PRIMARY KEY NOT NULL,"variant_id" integer NOT NULL,"change" integer NOT NULL,"reason" varchar(100),"reference_id" integer,"notes" text,"created_at" timestamp DEFAULT now())`,
    `CREATE TABLE "analytics_events" ("id" serial PRIMARY KEY NOT NULL,"event" varchar(100) NOT NULL,"user_id" integer,"session_id" varchar(255),"product_id" integer,"metadata" jsonb,"created_at" timestamp DEFAULT now())`,
  ];

  for (const stmt of drops) await sql.query(stmt);
  for (const stmt of creates) await sql.query(stmt);

  console.log("Migration complete! 16 tables created.");
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
