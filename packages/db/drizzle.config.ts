import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env["DATABASE_URL"] ?? "",
    ssl: process.env["NODE_ENV"] === "production" || process.env["DATABASE_URL"]?.includes("railway") ? { rejectUnauthorized: false } : false,
  },
} satisfies Config;
