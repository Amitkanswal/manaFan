// Prisma 7 configuration file
// Database URLs are configured here instead of schema.prisma
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local first, then fallback to .env
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  // Schema file location
  schema: "prisma/schema.prisma",
  
  // Database connection
  datasource: {
    // Use DIRECT_URL for migrations (port 5432) - required for db push
    url: process.env.DIRECT_URL,
  }
});
