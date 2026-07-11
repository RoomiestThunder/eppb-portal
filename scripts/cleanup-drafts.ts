// Deletes DRAFT applications that haven't been touched in DRAFT_TTL_DAYS. Intended to run on a
// schedule (cron / Kubernetes CronJob) — not wired into the app itself, since Next.js has no
// built-in background scheduler. Run manually: `npx tsx scripts/cleanup-drafts.ts`.
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const DRAFT_TTL_DAYS = Number(process.env.DRAFT_TTL_DAYS ?? 90);

async function main() {
  const cutoff = new Date(Date.now() - DRAFT_TTL_DAYS * 24 * 60 * 60 * 1000);
  const { count } = await prisma.application.deleteMany({
    where: {
      status: "DRAFT",
      OR: [{ lastAutosaveAt: { lt: cutoff } }, { lastAutosaveAt: null, createdAt: { lt: cutoff } }],
    },
  });
  console.log(`[cleanup-drafts] removed ${count} draft(s) older than ${DRAFT_TTL_DAYS} days`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
