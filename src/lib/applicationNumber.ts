import { prisma } from "@/lib/prisma";

// Atomic counter (single UPDATE ... SET value = value + 1 under the hood) — avoids the
// classic read-then-write race of generating the number from count() under concurrent submits.
export async function nextApplicationNumber() {
  const year = new Date().getFullYear();
  const counterId = `application_number_${year}`;
  const counter = await prisma.counter.upsert({
    where: { id: counterId },
    create: { id: counterId, value: 1 },
    update: { value: { increment: 1 } },
  });
  return `EPPB-${year}-${String(counter.value).padStart(6, "0")}`;
}
