import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, ADMIN_ROLES } from "@/lib/session";
import { diffFields, summarizeRecord, fieldLabel } from "@/lib/auditDiff";

// Structured export of the constructor's audit trail for offline analysis (Excel/Sheets, or a
// script) — the in-app view only shows the last few pages, this covers everything at once.
const EXPORT_LIMIT = 5000;

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET() {
  const session = await getSession();
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: EXPORT_LIMIT,
  });

  const header = ["Дата", "Пользователь", "Действие", "Тип объекта", "ID объекта", "Изменённые поля", "До (JSON)", "После (JSON)"];
  const rows = logs.map((l) => {
    const isCreate = l.action === "create";
    const isDelete = l.action === "delete";
    let changed = "";
    if (isCreate || isDelete) {
      changed = summarizeRecord(isCreate ? l.after : l.before);
    } else {
      changed = diffFields(l.before, l.after)
        .map((d) => `${fieldLabel(d.key)}: ${d.before} → ${d.after}`)
        .join("; ");
    }
    return [
      l.createdAt.toISOString(),
      l.user.fullName,
      l.action,
      l.entityType,
      l.entityId,
      changed,
      l.before ?? "",
      l.after ?? "",
    ];
  });

  const csv = [header, ...rows].map((row) => row.map((cell) => csvEscape(String(cell))).join(",")).join("\r\n");
  // UTF-8 BOM so Excel opens Cyrillic content correctly instead of mangling the encoding.
  const body = "﻿" + csv;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
