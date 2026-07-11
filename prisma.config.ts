import "dotenv/config";
import { defineConfig } from "@prisma/config";

// `env("DATABASE_URL")` from @prisma/config throws if the variable isn't set at config-load
// time, which happens during `npm ci`'s postinstall (prisma generate) - before CI/Docker set
// DATABASE_URL as an actual env var. `generate` never touches the database, so a plain fallback
// here is fine; migrate/deploy/runtime all pass a real DATABASE_URL and override it anyway.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
