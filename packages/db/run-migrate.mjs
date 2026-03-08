import pg from "pg";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Prefer DATABASE_PUBLIC_URL (set by Railway for external access) over internal DATABASE_URL
const DATABASE_URL = process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log("Connected to Railway PostgreSQL");

const migrations = ["0000_slow_peter_quill.sql", "0001_initial.sql"].filter(f => {
  try { readFileSync(join(__dirname, "migrations", f)); return true; } catch { return false; }
});

for (const file of migrations) {
  const sql = readFileSync(join(__dirname, "migrations", file), "utf8");
  console.log(`Running ${file}...`);
  try {
    await client.query(sql);
    console.log(`✅ ${file} applied`);
  } catch (err) {
    if (err.message.includes("already exists")) {
      console.log(`⚠️  ${file} already applied (skipped)`);
    } else {
      console.error(`❌ ${file} failed:`, err.message);
    }
  }
}

await client.end();
console.log("Done.");
