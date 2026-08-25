import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("Connecting to database...");
  
  const migrationPath = join(process.cwd(), "drizzle", "0000_foamy_trish_tilby.sql");
  const migrationSQL = readFileSync(migrationPath, "utf-8");
  
  // Split by semicolons and execute each statement
  const statements = migrationSQL
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  for (const statement of statements) {
    try {
      await sql.query(statement);
    } catch (e: any) {
      // Ignore "already exists" errors
      if (!e.message?.includes("already exists")) {
        console.error("Error executing:", statement.substring(0, 80));
        console.error(e.message);
      }
    }
  }
  
  console.log("Migration complete!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
