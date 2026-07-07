import { prisma } from "@/lib/prisma";
import { mockBpmSubmit } from "@/lib/integrations";

// Transactional-outbox stand-in for a real message broker (Kafka/RabbitMQ).
// Application submission writes a row here instead of calling BPM synchronously — a
// slow/unavailable BPM system then can't block the request that already committed the
// applicant's data. A worker (scripts/worker.ts, or an admin-triggered "process now" for
// the demo) drains the table. Swapping this for real Kafka means: enqueue() becomes a
// producer.send() to `topic`, and processPendingOutboxEvents() becomes a consumer handler —
// the call sites in the rest of the app don't change.

export async function enqueueOutboxEvent(topic: string, payload: Record<string, unknown>) {
  return prisma.outboxEvent.create({ data: { topic, payload: JSON.stringify(payload) } });
}

async function processEvent(event: { id: string; topic: string; payload: string; attempts: number }) {
  const payload = JSON.parse(event.payload) as { applicationId: string; number: string; organizationCode: string; organizationName: string };
  try {
    const bpm = await mockBpmSubmit(payload.number, payload.organizationCode);
    await prisma.application.update({ where: { id: payload.applicationId }, data: { status: "IN_REVIEW" } });
    await prisma.applicationEvent.create({
      data: {
        applicationId: payload.applicationId,
        type: "integration",
        message: `Заявка передана в BPM ${payload.organizationName} (mock, через очередь), caseId: ${bpm.bpmCaseId}`,
      },
    });
    await prisma.outboxEvent.update({ where: { id: event.id }, data: { status: "processed", processedAt: new Date(), attempts: event.attempts + 1 } });
    return true;
  } catch {
    const attempts = event.attempts + 1;
    await prisma.outboxEvent.update({
      where: { id: event.id },
      data: { attempts, status: attempts >= 5 ? "failed" : "pending" },
    });
    return false;
  }
}

export async function processPendingOutboxEvents(limit = 20) {
  const events = await prisma.outboxEvent.findMany({ where: { status: "pending" }, orderBy: { createdAt: "asc" }, take: limit });
  let processed = 0;
  let failed = 0;
  for (const event of events) {
    const ok = await processEvent(event);
    if (ok) processed++;
    else failed++;
  }
  return { processed, failed, remaining: events.length - processed - failed };
}
