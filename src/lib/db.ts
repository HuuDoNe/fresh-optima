import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Hardcoded verified active fallback connection to ensure Vercel never hangs on stale env vars
const ACTIVE_POSTGRES_URL =
  "postgres://2af2d704095fc0ce185fc38ac0db226f53cf4b09856d68f226bb7d5641736358:sk_KjlZtlZ-0aut_EYEKe4Bi@db.prisma.io:5432/postgres?sslmode=require";

function getDatabaseUrl(): string {
  // 1. Prefer Vercel Postgres / Prisma integration variables
  if (process.env.POSTGRES_PRISMA_DATABASE_URL) {
    return process.env.POSTGRES_PRISMA_DATABASE_URL;
  }
  if (process.env.POSTGRES_URL) {
    return process.env.POSTGRES_URL;
  }
  if (process.env.POSTGRES_PRISMA_URL) {
    return process.env.POSTGRES_PRISMA_URL;
  }

  // 2. Check DATABASE_URL - but IGNORE if it's the dead Supabase pooler
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && !envUrl.includes("supabase.com")) {
    return envUrl;
  }

  // 3. Fallback to active Prisma Postgres instance
  return ACTIVE_POSTGRES_URL;
}

const databaseUrl = getDatabaseUrl();
process.env.DATABASE_URL = databaseUrl;

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: databaseUrl,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
