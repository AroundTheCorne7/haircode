import type { Config } from "drizzle-kit";

export default {
  // Use glob to load each schema file directly — avoids drizzle-kit CJS bundler
  // failing on ESM `.js` re-exports in index.ts
  schema: "./src/schema/*.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env["DATABASE_URL"] ?? "",
    ssl:
      process.env["NODE_ENV"] === "production" ||
      process.env["DATABASE_URL"]?.includes("supabase")
        ? { rejectUnauthorized: false }
        : false,
  },
} satisfies Config;
