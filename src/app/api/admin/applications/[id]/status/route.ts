import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { STATUS_LABELS } from "@/lib/statusLabels";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "AUTHOR")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const { status } = (await req.json()) as { status: string };

  const app = await prisma.application.update({
    where: { id },
    data: {
      status: status as never,
      history: { create: [{ type: "status_change", message: `Статус изменен администратором: ${STATUS_LABELS[status] ?? status}` }] },
    },
  });

  await prisma.notification.create({
    data: {
      userId: app.userId,
      title: "Статус заявки обновлен",
      body: `Заявка №${app.number}: новый статус — ${STATUS_LABELS[status] ?? status}.`,
    },
  });

  return NextResponse.json({ ok: true });
}
