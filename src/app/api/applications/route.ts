import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { mockBpmSubmit, mockDocExchange, mockEsignSign } from "@/lib/integrations";
import { encryptString, decryptString } from "@/lib/crypto";
import { CircuitOpenError } from "@/lib/circuitBreaker";

// Atomic counter (single UPDATE ... SET value = value + 1 under the hood) — avoids the
// classic read-then-write race of generating the number from `count()` under concurrent submits.
async function nextApplicationNumber() {
  const year = new Date().getFullYear();
  const counterId = `application_number_${year}`;
  const counter = await prisma.counter.upsert({
    where: { id: counterId },
    create: { id: counterId, value: 1 },
    update: { value: { increment: 1 } },
  });
  return `EPPB-${year}-${String(counter.value).padStart(6, "0")}`;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    serviceId: string;
    data: Record<string, unknown>;
    applicationId?: string;
    targetStageOrder?: number;
    idempotencyKey?: string;
  };

  const service = await prisma.service.findUnique({
    where: { id: body.serviceId },
    include: { organization: true, stages: { orderBy: { order: "asc" }, include: { steps: { orderBy: { order: "asc" }, include: { fields: { orderBy: { order: "asc" } } } } } } },
  });
  if (!service) return NextResponse.json({ error: "service not found" }, { status: 404 });

  const fileEntries = Object.entries(body.data).filter(([, v]) => typeof v === "string" && (v as string).length > 0 && String(v).includes("."));

  if (body.applicationId) {
    // Submitting extended data for a later stage of an existing application
    const existing = await prisma.application.findUnique({ where: { id: body.applicationId } });
    if (!existing) return NextResponse.json({ error: "application not found" }, { status: 404 });

    const mergedData = { ...JSON.parse(decryptString(existing.data)), ...body.data };
    const updated = await prisma.application.update({
      where: { id: existing.id },
      data: {
        data: encryptString(JSON.stringify(mergedData)),
        currentStageOrder: body.targetStageOrder ?? existing.currentStageOrder + 1,
        status: "IN_REVIEW",
        history: {
          create: [{ type: "status_change", message: "Расширенные данные предоставлены. Заявка возвращена на рассмотрение." }],
        },
      },
    });

    for (const [key, value] of fileEntries) {
      const doc = await mockDocExchange(String(value));
      await prisma.applicationDocument.create({
        data: { applicationId: updated.id, fieldKey: key, fileName: String(value), mockUrl: doc.url },
      });
    }

    await prisma.notification.create({
      data: {
        userId: existing.userId,
        title: "Расширенные данные приняты",
        body: `Дополнительные документы по заявке №${updated.number} переданы на рассмотрение.`,
      },
    });

    return NextResponse.json({ number: updated.number, applicationId: updated.id });
  }

  // Idempotent replay: if the client retried a submit (double-click, network timeout + retry),
  // the same idempotencyKey returns the already-created application instead of making a duplicate.
  if (body.idempotencyKey) {
    const already = await prisma.application.findUnique({ where: { idempotencyKey: body.idempotencyKey } });
    if (already) return NextResponse.json({ number: already.number, applicationId: already.id });
  }

  const number = await nextApplicationNumber();
  // Snapshot the schema the applicant actually filled — if an admin edits/republishes this service
  // later, this application's own record of "what the form looked like" doesn't change retroactively.
  const schemaSnapshot = JSON.stringify(service.stages);

  let application;
  try {
    application = await prisma.application.create({
      data: {
        number,
        idempotencyKey: body.idempotencyKey,
        serviceId: service.id,
        serviceVersion: service.version,
        schemaSnapshot,
        userId: session.userId,
        status: "SUBMITTED",
        currentStageOrder: 1,
        data: encryptString(JSON.stringify(body.data)),
        history: { create: [{ type: "status_change", message: "Заявка подана предпринимателем" }] },
      },
    });
  } catch (err: unknown) {
    // Unique constraint race on idempotencyKey — another request with the same key won the create.
    if (body.idempotencyKey && err && typeof err === "object" && "code" in err && err.code === "P2002") {
      const winner = await prisma.application.findUnique({ where: { idempotencyKey: body.idempotencyKey } });
      if (winner) return NextResponse.json({ number: winner.number, applicationId: winner.id });
    }
    throw err;
  }

  // Everything past this point talks to external systems (mocked here). Their failure must not
  // fail the whole request — the applicant's data is already safely committed above.
  const degradedEvents: string[] = [];

  try {
    const esign = await mockEsignSign(`Заявка ${number}`);
    await prisma.applicationEvent.create({
      data: { applicationId: application.id, type: "integration", message: `Заявка подписана ЭЦП (mock), signatureId: ${esign.signatureId}` },
    });
  } catch (err) {
    degradedEvents.push(err instanceof CircuitOpenError ? "esign_circuit_open" : "esign_failed");
    await prisma.applicationEvent.create({
      data: { applicationId: application.id, type: "integration", message: "ЭЦП временно недоступна — заявка сохранена, подписание будет повторено автоматически." },
    });
  }

  for (const [key, value] of fileEntries) {
    try {
      const doc = await mockDocExchange(String(value));
      await prisma.applicationDocument.create({
        data: { applicationId: application.id, fieldKey: key, fileName: String(value), mockUrl: doc.url, signedEsign: true },
      });
    } catch {
      degradedEvents.push("doc_exchange_failed");
    }
  }

  let finalStatus: "SUBMITTED" | "IN_REVIEW" = "SUBMITTED";
  try {
    const bpm = await mockBpmSubmit(number, service.organization.code);
    await prisma.applicationEvent.create({
      data: { applicationId: application.id, type: "integration", message: `Заявка передана в BPM ${service.organization.shortName} (mock), caseId: ${bpm.bpmCaseId}` },
    });
    finalStatus = "IN_REVIEW";
  } catch (err) {
    degradedEvents.push(err instanceof CircuitOpenError ? "bpm_circuit_open" : "bpm_failed");
    await prisma.applicationEvent.create({
      data: {
        applicationId: application.id,
        type: "integration",
        message: `BPM ${service.organization.shortName} временно недоступна — заявка принята и будет передана автоматически, как только связь восстановится.`,
      },
    });
  }

  const finalApp = await prisma.application.update({ where: { id: application.id }, data: { status: finalStatus } });

  await prisma.notification.create({
    data: {
      userId: session.userId,
      title: degradedEvents.length === 0 ? "Заявка принята в работу" : "Заявка сохранена",
      body:
        degradedEvents.length === 0
          ? `Ваша заявка №${number} на услугу «${service.name}» принята и передана на рассмотрение в ${service.organization.shortName}.`
          : `Ваша заявка №${number} сохранена. Часть систем временно недоступна — передача на рассмотрение произойдёт автоматически, отслеживайте статус в личном кабинете.`,
    },
  });

  return NextResponse.json({ number: finalApp.number, applicationId: finalApp.id, degraded: degradedEvents.length > 0 });
}
