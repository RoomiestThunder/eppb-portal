import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { mockBpmSubmit, mockDocExchange, mockEsignSign } from "@/lib/integrations";

async function nextApplicationNumber() {
  const count = await prisma.application.count();
  const year = new Date().getFullYear();
  return `EPPB-${year}-${String(count + 1).padStart(6, "0")}`;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    serviceId: string;
    data: Record<string, unknown>;
    applicationId?: string;
    targetStageOrder?: number;
  };

  const service = await prisma.service.findUnique({ where: { id: body.serviceId }, include: { organization: true } });
  if (!service) return NextResponse.json({ error: "service not found" }, { status: 404 });

  const fileEntries = Object.entries(body.data).filter(([, v]) => typeof v === "string" && (v as string).length > 0 && String(v).includes("."));

  if (body.applicationId) {
    // Submitting extended data for a later stage of an existing application
    const existing = await prisma.application.findUnique({ where: { id: body.applicationId } });
    if (!existing) return NextResponse.json({ error: "application not found" }, { status: 404 });

    const mergedData = { ...JSON.parse(existing.data), ...body.data };
    const updated = await prisma.application.update({
      where: { id: existing.id },
      data: {
        data: JSON.stringify(mergedData),
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

  const number = await nextApplicationNumber();

  const application = await prisma.application.create({
    data: {
      number,
      serviceId: service.id,
      userId: session.userId,
      status: "SUBMITTED",
      currentStageOrder: 1,
      data: JSON.stringify(body.data),
      history: { create: [{ type: "status_change", message: "Заявка подана предпринимателем" }] },
    },
  });

  const esign = await mockEsignSign(`Заявка ${number}`);
  await prisma.applicationEvent.create({
    data: { applicationId: application.id, type: "integration", message: `Заявка подписана ЭЦП (mock), signatureId: ${esign.signatureId}` },
  });

  for (const [key, value] of fileEntries) {
    const doc = await mockDocExchange(String(value));
    await prisma.applicationDocument.create({
      data: { applicationId: application.id, fieldKey: key, fileName: String(value), mockUrl: doc.url, signedEsign: true },
    });
  }

  const bpm = await mockBpmSubmit(number, service.organization.code);
  const finalApp = await prisma.application.update({
    where: { id: application.id },
    data: {
      status: "IN_REVIEW",
      history: {
        create: [{ type: "integration", message: `Заявка передана в BPM ${service.organization.shortName} (mock), caseId: ${bpm.bpmCaseId}` }],
      },
    },
  });

  await prisma.notification.create({
    data: {
      userId: session.userId,
      title: "Заявка принята в работу",
      body: `Ваша заявка №${number} на услугу «${service.name}» принята и передана на рассмотрение в ${service.organization.shortName}.`,
    },
  });

  return NextResponse.json({ number: finalApp.number, applicationId: finalApp.id });
}
