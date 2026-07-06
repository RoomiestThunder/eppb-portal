import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// Single mutation endpoint for the no-code constructor.
// A real product would likely split this into REST resources; for the MVP a
// dispatch table keeps the admin builder's read-modify-refresh loop simple
// while every action stays auditable and centrally authorized in one place.

type Action =
  | { action: "createService"; payload: { name: string; category: string; organizationId: string; shortDescription: string } }
  | { action: "updateService"; payload: { id: string; data: Record<string, unknown> } }
  | { action: "deleteService"; payload: { id: string } }
  | { action: "publishService"; payload: { id: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" } }
  | { action: "createStage"; payload: { serviceId: string; title: string } }
  | { action: "updateStage"; payload: { id: string; data: Record<string, unknown> } }
  | { action: "deleteStage"; payload: { id: string } }
  | { action: "createStep"; payload: { stageId: string; title: string } }
  | { action: "updateStep"; payload: { id: string; data: Record<string, unknown> } }
  | { action: "deleteStep"; payload: { id: string } }
  | { action: "createField"; payload: { stepId: string; key: string; label: string; type: string } }
  | { action: "updateField"; payload: { id: string; data: Record<string, unknown> } }
  | { action: "deleteField"; payload: { id: string } }
  | { action: "reorder"; payload: { type: "stage" | "step" | "field"; ids: string[] } }
  | { action: "createLookup"; payload: { code: string; name: string } }
  | { action: "deleteLookup"; payload: { id: string } }
  | { action: "createLookupItem"; payload: { lookupId: string; value: string; label: string } }
  | { action: "updateLookupItem"; payload: { id: string; data: Record<string, unknown> } }
  | { action: "deleteLookupItem"; payload: { id: string } }
  | { action: "createAnalyticsMaterial"; payload: Record<string, unknown> }
  | { action: "updateAnalyticsMaterial"; payload: { id: string; data: Record<string, unknown> } }
  | { action: "deleteAnalyticsMaterial"; payload: { id: string } }
  | { action: "createProject"; payload: Record<string, unknown> }
  | { action: "updateProject"; payload: { id: string; data: Record<string, unknown> } }
  | { action: "deleteProject"; payload: { id: string } }
  | { action: "createResourceItem"; payload: Record<string, unknown> }
  | { action: "updateResourceItem"; payload: { id: string; data: Record<string, unknown> } }
  | { action: "deleteResourceItem"; payload: { id: string } };

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "AUTHOR")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as Action;

  switch (body.action) {
    case "createService": {
      const { name, category, organizationId, shortDescription } = body.payload;
      const slug = name
        .toLowerCase()
        .replace(/[^a-zа-яё0-9]+/gi, "-")
        .replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);
      const service = await prisma.service.create({
        data: {
          slug,
          name,
          category,
          organizationId,
          shortDescription,
          status: "DRAFT",
          stages: { create: [{ order: 1, title: "Первичная заявка", steps: { create: [{ order: 1, title: "Шаг 1" }] } }] },
        },
      });
      return NextResponse.json({ id: service.id, slug: service.slug });
    }
    case "updateService": {
      await prisma.service.update({ where: { id: body.payload.id }, data: body.payload.data });
      return NextResponse.json({ ok: true });
    }
    case "deleteService": {
      await prisma.service.delete({ where: { id: body.payload.id } });
      return NextResponse.json({ ok: true });
    }
    case "publishService": {
      await prisma.service.update({ where: { id: body.payload.id }, data: { status: body.payload.status } });
      return NextResponse.json({ ok: true });
    }
    case "createStage": {
      const count = await prisma.serviceStage.count({ where: { serviceId: body.payload.serviceId } });
      const stage = await prisma.serviceStage.create({
        data: { serviceId: body.payload.serviceId, order: count + 1, title: body.payload.title, steps: { create: [{ order: 1, title: "Шаг 1" }] } },
      });
      return NextResponse.json({ id: stage.id });
    }
    case "updateStage": {
      await prisma.serviceStage.update({ where: { id: body.payload.id }, data: body.payload.data });
      return NextResponse.json({ ok: true });
    }
    case "deleteStage": {
      await prisma.serviceStage.delete({ where: { id: body.payload.id } });
      return NextResponse.json({ ok: true });
    }
    case "createStep": {
      const count = await prisma.serviceStep.count({ where: { stageId: body.payload.stageId } });
      const step = await prisma.serviceStep.create({ data: { stageId: body.payload.stageId, order: count + 1, title: body.payload.title } });
      return NextResponse.json({ id: step.id });
    }
    case "updateStep": {
      await prisma.serviceStep.update({ where: { id: body.payload.id }, data: body.payload.data });
      return NextResponse.json({ ok: true });
    }
    case "deleteStep": {
      await prisma.serviceStep.delete({ where: { id: body.payload.id } });
      return NextResponse.json({ ok: true });
    }
    case "createField": {
      const count = await prisma.formField.count({ where: { stepId: body.payload.stepId } });
      const field = await prisma.formField.create({
        data: {
          stepId: body.payload.stepId,
          order: count + 1,
          key: body.payload.key,
          label: body.payload.label,
          type: body.payload.type as never,
        },
      });
      return NextResponse.json({ id: field.id });
    }
    case "updateField": {
      await prisma.formField.update({ where: { id: body.payload.id }, data: body.payload.data as never });
      return NextResponse.json({ ok: true });
    }
    case "deleteField": {
      await prisma.formField.delete({ where: { id: body.payload.id } });
      return NextResponse.json({ ok: true });
    }
    case "reorder": {
      const { type, ids } = body.payload;
      const model = type === "stage" ? prisma.serviceStage : type === "step" ? prisma.serviceStep : prisma.formField;
      await Promise.all(ids.map((id, idx) => (model as typeof prisma.formField).update({ where: { id }, data: { order: idx + 1 } })));
      return NextResponse.json({ ok: true });
    }
    case "createLookup": {
      const lookup = await prisma.lookup.create({ data: { code: body.payload.code, name: body.payload.name } });
      return NextResponse.json({ id: lookup.id });
    }
    case "deleteLookup": {
      await prisma.lookup.delete({ where: { id: body.payload.id } });
      return NextResponse.json({ ok: true });
    }
    case "createLookupItem": {
      const count = await prisma.lookupItem.count({ where: { lookupId: body.payload.lookupId } });
      const item = await prisma.lookupItem.create({
        data: { lookupId: body.payload.lookupId, value: body.payload.value, label: body.payload.label, order: count + 1 },
      });
      return NextResponse.json({ id: item.id });
    }
    case "updateLookupItem": {
      await prisma.lookupItem.update({ where: { id: body.payload.id }, data: body.payload.data });
      return NextResponse.json({ ok: true });
    }
    case "deleteLookupItem": {
      await prisma.lookupItem.delete({ where: { id: body.payload.id } });
      return NextResponse.json({ ok: true });
    }
    case "createAnalyticsMaterial": {
      const item = await prisma.analyticsMaterial.create({ data: body.payload as never });
      return NextResponse.json({ id: item.id });
    }
    case "updateAnalyticsMaterial": {
      await prisma.analyticsMaterial.update({ where: { id: body.payload.id }, data: body.payload.data as never });
      return NextResponse.json({ ok: true });
    }
    case "deleteAnalyticsMaterial": {
      await prisma.analyticsMaterial.delete({ where: { id: body.payload.id } });
      return NextResponse.json({ ok: true });
    }
    case "createProject": {
      const item = await prisma.project.create({ data: body.payload as never });
      return NextResponse.json({ id: item.id });
    }
    case "updateProject": {
      await prisma.project.update({ where: { id: body.payload.id }, data: body.payload.data as never });
      return NextResponse.json({ ok: true });
    }
    case "deleteProject": {
      await prisma.project.delete({ where: { id: body.payload.id } });
      return NextResponse.json({ ok: true });
    }
    case "createResourceItem": {
      const item = await prisma.resourceItem.create({ data: body.payload as never });
      return NextResponse.json({ id: item.id });
    }
    case "updateResourceItem": {
      await prisma.resourceItem.update({ where: { id: body.payload.id }, data: body.payload.data as never });
      return NextResponse.json({ ok: true });
    }
    case "deleteResourceItem": {
      await prisma.resourceItem.delete({ where: { id: body.payload.id } });
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
}
