import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { encryptString } from "@/lib/crypto";
import { nextApplicationNumber } from "@/lib/applicationNumber";

// Draft autosave: the wizard calls this periodically while the applicant is still filling out
// stage 1. Nothing here talks to eGov/ЭЦП/BPM — those only run once the applicant actually
// submits (see /api/applications). A background job (or a manual admin action) can clean up
// drafts whose lastAutosaveAt is older than the TTL — see scripts/cleanup-drafts.ts.

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as { serviceId: string; data: Record<string, unknown>; draftId?: string };

  if (body.draftId) {
    const existing = await prisma.application.findUnique({ where: { id: body.draftId } });
    if (!existing || existing.userId !== session.userId) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (existing.status !== "DRAFT") {
      // Already finalized in another tab/request — nothing to autosave anymore.
      return NextResponse.json({ draftId: existing.id, number: existing.number, alreadySubmitted: true });
    }
    const updated = await prisma.application.update({
      where: { id: existing.id },
      data: { data: encryptString(JSON.stringify(body.data)), lastAutosaveAt: new Date() },
    });
    return NextResponse.json({ draftId: updated.id, number: updated.number });
  }

  const number = await nextApplicationNumber();
  const draft = await prisma.application.create({
    data: {
      number,
      serviceId: body.serviceId,
      userId: session.userId,
      status: "DRAFT",
      currentStageOrder: 1,
      data: encryptString(JSON.stringify(body.data)),
      lastAutosaveAt: new Date(),
    },
  });
  return NextResponse.json({ draftId: draft.id, number: draft.number });
}
