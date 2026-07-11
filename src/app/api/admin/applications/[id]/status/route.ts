import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, WRITE_ROLES, ORG_SCOPED_ROLES } from "@/lib/session";
import { STATUS_LABELS, getStatusLabel } from "@/lib/statusLabels";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !WRITE_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const { status } = (await req.json()) as { status: string };

  const existing = await prisma.application.findUnique({ where: { id }, include: { service: true } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (ORG_SCOPED_ROLES.includes(session.role) && existing.service.organizationId !== session.organizationId) {
    return NextResponse.json({ error: "forbidden: outside your organization's scope" }, { status: 403 });
  }

  const app = await prisma.application.update({
    where: { id },
    data: {
      status: status as never,
      history: { create: [{ type: "status_change", message: `Статус изменен администратором: ${STATUS_LABELS[status] ?? status}` }] },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      entityType: "Application",
      entityId: id,
      action: "update",
      before: JSON.stringify({ status: existing.status }),
      after: JSON.stringify({ status: app.status }),
    },
  });

  await prisma.notification.create({
    data: {
      userId: app.userId,
      title: "Статус заявки обновлен",
      titleKk: "Өтініш мәртебесі жаңартылды",
      body: `Заявка №${app.number}: новый статус — ${STATUS_LABELS[status] ?? status}.`,
      bodyKk: `Өтініш №${app.number}: жаңа мәртебе — ${getStatusLabel(status, "kk")}.`,
    },
  });

  return NextResponse.json({ ok: true });
}
