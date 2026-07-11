import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await prisma.notification.updateMany({ where: { userId: session.userId, read: false }, data: { read: true } });

  return NextResponse.json({ ok: true });
}
