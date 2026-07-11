import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, WRITE_ROLES, ORG_SCOPED_ROLES, type Session } from "@/lib/session";

// Single mutation endpoint for the no-code constructor.
// A real product would likely split this into REST resources; for the MVP a
// dispatch table keeps the admin builder's read-modify-refresh loop simple
// while every action stays auditable and centrally authorized in one place.
//
// Every mutation here is (1) role-checked, (2) organization-scoped for ORG_ADMIN/AUTHOR
// (they can only touch entities belonging to their own organization), and (3) written to
// AuditLog with a before/after snapshot — see writeAudit() below.

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
  | { action: "createLookup"; payload: { code: string; name: string } }
  | { action: "deleteLookup"; payload: { id: string } }
  | { action: "createLookupItem"; payload: { lookupId: string; value: string; label: string; labelKk?: string | null } }
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

class ForbiddenError extends Error {}

async function writeAudit(
  session: Session,
  entityType: string,
  entityId: string,
  action: string,
  before: unknown,
  after: unknown
) {
  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      entityType,
      entityId,
      action,
      before: before === null || before === undefined ? null : JSON.stringify(before),
      after: after === null || after === undefined ? null : JSON.stringify(after),
    },
  });
}

// Resolves the owning Service.organizationId for any node in the Service→Stage→Step→Field tree,
// and throws if an org-scoped session (ORG_ADMIN/AUTHOR) doesn't own it.
async function assertServiceAccess(session: Session, serviceId: string) {
  if (!ORG_SCOPED_ROLES.includes(session.role)) return;
  const service = await prisma.service.findUnique({ where: { id: serviceId }, select: { organizationId: true } });
  if (!service || service.organizationId !== session.organizationId) throw new ForbiddenError();
}

async function serviceIdOfStage(id: string) {
  const stage = await prisma.serviceStage.findUnique({ where: { id }, select: { serviceId: true } });
  if (!stage) throw new Error("stage not found");
  return stage.serviceId;
}
async function serviceIdOfStep(id: string) {
  const step = await prisma.serviceStep.findUnique({ where: { id }, select: { stage: { select: { serviceId: true } } } });
  if (!step) throw new Error("step not found");
  return step.stage.serviceId;
}
async function serviceIdOfField(id: string) {
  const field = await prisma.formField.findUnique({ where: { id }, select: { step: { select: { stage: { select: { serviceId: true } } } } } });
  if (!field) throw new Error("field not found");
  return field.step.stage.serviceId;
}

function assertOrgOwnership(session: Session, organizationId: string | null | undefined) {
  if (!ORG_SCOPED_ROLES.includes(session.role)) return;
  if (organizationId !== session.organizationId) throw new ForbiddenError();
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !WRITE_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as Action;

  try {
    switch (body.action) {
      case "createService": {
        const { name, category, organizationId, shortDescription } = body.payload;
        // Org-scoped roles can only create services for their own organization, regardless of what the client sent.
        const targetOrgId = ORG_SCOPED_ROLES.includes(session.role) ? session.organizationId! : organizationId;
        const slug =
          name
            .toLowerCase()
            .replace(/[^a-zа-яё0-9]+/gi, "-")
            .replace(/(^-|-$)/g, "") +
          "-" +
          Date.now().toString(36);
        const service = await prisma.service.create({
          data: {
            slug,
            name,
            category,
            organizationId: targetOrgId,
            shortDescription,
            status: "DRAFT",
            stages: { create: [{ order: 1, title: "Первичная заявка", steps: { create: [{ order: 1, title: "Шаг 1" }] } }] },
          },
        });
        await writeAudit(session, "Service", service.id, "create", null, service);
        return NextResponse.json({ id: service.id, slug: service.slug });
      }
      case "updateService": {
        await assertServiceAccess(session, body.payload.id);
        const before = await prisma.service.findUnique({ where: { id: body.payload.id } });
        const after = await prisma.service.update({ where: { id: body.payload.id }, data: body.payload.data });
        await writeAudit(session, "Service", body.payload.id, "update", before, after);
        return NextResponse.json({ ok: true });
      }
      case "deleteService": {
        await assertServiceAccess(session, body.payload.id);
        const before = await prisma.service.findUnique({ where: { id: body.payload.id } });
        await prisma.service.delete({ where: { id: body.payload.id } });
        await writeAudit(session, "Service", body.payload.id, "delete", before, null);
        return NextResponse.json({ ok: true });
      }
      case "publishService": {
        await assertServiceAccess(session, body.payload.id);
        const before = await prisma.service.findUnique({ where: { id: body.payload.id } });
        // Publishing bumps the version — submitted applications snapshot the schema they were filled
        // against, so changing/republishing a service afterward can't retroactively affect them.
        const after = await prisma.service.update({
          where: { id: body.payload.id },
          data: { status: body.payload.status, version: { increment: 1 } },
        });
        await writeAudit(session, "Service", body.payload.id, "publish", before, after);
        return NextResponse.json({ ok: true });
      }
      case "createStage": {
        await assertServiceAccess(session, body.payload.serviceId);
        const count = await prisma.serviceStage.count({ where: { serviceId: body.payload.serviceId } });
        const stage = await prisma.serviceStage.create({
          data: { serviceId: body.payload.serviceId, order: count + 1, title: body.payload.title, steps: { create: [{ order: 1, title: "Шаг 1" }] } },
        });
        await writeAudit(session, "ServiceStage", stage.id, "create", null, stage);
        return NextResponse.json({ id: stage.id });
      }
      case "updateStage": {
        await assertServiceAccess(session, await serviceIdOfStage(body.payload.id));
        const before = await prisma.serviceStage.findUnique({ where: { id: body.payload.id } });
        const after = await prisma.serviceStage.update({ where: { id: body.payload.id }, data: body.payload.data });
        await writeAudit(session, "ServiceStage", body.payload.id, "update", before, after);
        return NextResponse.json({ ok: true });
      }
      case "deleteStage": {
        await assertServiceAccess(session, await serviceIdOfStage(body.payload.id));
        const before = await prisma.serviceStage.findUnique({ where: { id: body.payload.id } });
        await prisma.serviceStage.delete({ where: { id: body.payload.id } });
        await writeAudit(session, "ServiceStage", body.payload.id, "delete", before, null);
        return NextResponse.json({ ok: true });
      }
      case "createStep": {
        await assertServiceAccess(session, await serviceIdOfStage(body.payload.stageId));
        const count = await prisma.serviceStep.count({ where: { stageId: body.payload.stageId } });
        const step = await prisma.serviceStep.create({ data: { stageId: body.payload.stageId, order: count + 1, title: body.payload.title } });
        await writeAudit(session, "ServiceStep", step.id, "create", null, step);
        return NextResponse.json({ id: step.id });
      }
      case "updateStep": {
        await assertServiceAccess(session, await serviceIdOfStep(body.payload.id));
        const before = await prisma.serviceStep.findUnique({ where: { id: body.payload.id } });
        const after = await prisma.serviceStep.update({ where: { id: body.payload.id }, data: body.payload.data });
        await writeAudit(session, "ServiceStep", body.payload.id, "update", before, after);
        return NextResponse.json({ ok: true });
      }
      case "deleteStep": {
        await assertServiceAccess(session, await serviceIdOfStep(body.payload.id));
        const before = await prisma.serviceStep.findUnique({ where: { id: body.payload.id } });
        await prisma.serviceStep.delete({ where: { id: body.payload.id } });
        await writeAudit(session, "ServiceStep", body.payload.id, "delete", before, null);
        return NextResponse.json({ ok: true });
      }
      case "createField": {
        await assertServiceAccess(session, await serviceIdOfStep(body.payload.stepId));
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
        await writeAudit(session, "FormField", field.id, "create", null, field);
        return NextResponse.json({ id: field.id });
      }
      case "updateField": {
        await assertServiceAccess(session, await serviceIdOfField(body.payload.id));
        const before = await prisma.formField.findUnique({ where: { id: body.payload.id } });
        const after = await prisma.formField.update({ where: { id: body.payload.id }, data: body.payload.data as never });
        await writeAudit(session, "FormField", body.payload.id, "update", before, after);
        return NextResponse.json({ ok: true });
      }
      case "deleteField": {
        await assertServiceAccess(session, await serviceIdOfField(body.payload.id));
        const before = await prisma.formField.findUnique({ where: { id: body.payload.id } });
        await prisma.formField.delete({ where: { id: body.payload.id } });
        await writeAudit(session, "FormField", body.payload.id, "delete", before, null);
        return NextResponse.json({ ok: true });
      }
      // Lookups are shared reference data across all organizations — not org-scoped by design.
      case "createLookup": {
        const lookup = await prisma.lookup.create({ data: { code: body.payload.code, name: body.payload.name } });
        await writeAudit(session, "Lookup", lookup.id, "create", null, lookup);
        return NextResponse.json({ id: lookup.id });
      }
      case "deleteLookup": {
        const before = await prisma.lookup.findUnique({ where: { id: body.payload.id } });
        await prisma.lookup.delete({ where: { id: body.payload.id } });
        await writeAudit(session, "Lookup", body.payload.id, "delete", before, null);
        return NextResponse.json({ ok: true });
      }
      case "createLookupItem": {
        const count = await prisma.lookupItem.count({ where: { lookupId: body.payload.lookupId } });
        const item = await prisma.lookupItem.create({
          data: {
            lookupId: body.payload.lookupId,
            value: body.payload.value,
            label: body.payload.label,
            labelKk: body.payload.labelKk ?? null,
            order: count + 1,
          },
        });
        await writeAudit(session, "LookupItem", item.id, "create", null, item);
        return NextResponse.json({ id: item.id });
      }
      case "updateLookupItem": {
        const before = await prisma.lookupItem.findUnique({ where: { id: body.payload.id } });
        const after = await prisma.lookupItem.update({ where: { id: body.payload.id }, data: body.payload.data as never });
        await writeAudit(session, "LookupItem", body.payload.id, "update", before, after);
        return NextResponse.json({ ok: true });
      }
      case "deleteLookupItem": {
        const before = await prisma.lookupItem.findUnique({ where: { id: body.payload.id } });
        await prisma.lookupItem.delete({ where: { id: body.payload.id } });
        await writeAudit(session, "LookupItem", body.payload.id, "delete", before, null);
        return NextResponse.json({ ok: true });
      }
      case "createAnalyticsMaterial": {
        assertOrgOwnership(session, body.payload.organizationId as string | undefined);
        const item = await prisma.analyticsMaterial.create({ data: body.payload as never });
        await writeAudit(session, "AnalyticsMaterial", item.id, "create", null, item);
        return NextResponse.json({ id: item.id });
      }
      case "updateAnalyticsMaterial": {
        const before = await prisma.analyticsMaterial.findUnique({ where: { id: body.payload.id } });
        assertOrgOwnership(session, before?.organizationId);
        const after = await prisma.analyticsMaterial.update({ where: { id: body.payload.id }, data: body.payload.data as never });
        await writeAudit(session, "AnalyticsMaterial", body.payload.id, "update", before, after);
        return NextResponse.json({ ok: true });
      }
      case "deleteAnalyticsMaterial": {
        const before = await prisma.analyticsMaterial.findUnique({ where: { id: body.payload.id } });
        assertOrgOwnership(session, before?.organizationId);
        await prisma.analyticsMaterial.delete({ where: { id: body.payload.id } });
        await writeAudit(session, "AnalyticsMaterial", body.payload.id, "delete", before, null);
        return NextResponse.json({ ok: true });
      }
      case "createProject": {
        assertOrgOwnership(session, body.payload.organizationId as string | undefined);
        const item = await prisma.project.create({ data: body.payload as never });
        await writeAudit(session, "Project", item.id, "create", null, item);
        return NextResponse.json({ id: item.id });
      }
      case "updateProject": {
        const before = await prisma.project.findUnique({ where: { id: body.payload.id } });
        assertOrgOwnership(session, before?.organizationId);
        const after = await prisma.project.update({ where: { id: body.payload.id }, data: body.payload.data as never });
        await writeAudit(session, "Project", body.payload.id, "update", before, after);
        return NextResponse.json({ ok: true });
      }
      case "deleteProject": {
        const before = await prisma.project.findUnique({ where: { id: body.payload.id } });
        assertOrgOwnership(session, before?.organizationId);
        await prisma.project.delete({ where: { id: body.payload.id } });
        await writeAudit(session, "Project", body.payload.id, "delete", before, null);
        return NextResponse.json({ ok: true });
      }
      // Business-tools resources aren't org-specific by design — open to any write-capable role.
      case "createResourceItem": {
        const item = await prisma.resourceItem.create({ data: body.payload as never });
        await writeAudit(session, "ResourceItem", item.id, "create", null, item);
        return NextResponse.json({ id: item.id });
      }
      case "updateResourceItem": {
        const before = await prisma.resourceItem.findUnique({ where: { id: body.payload.id } });
        const after = await prisma.resourceItem.update({ where: { id: body.payload.id }, data: body.payload.data as never });
        await writeAudit(session, "ResourceItem", body.payload.id, "update", before, after);
        return NextResponse.json({ ok: true });
      }
      case "deleteResourceItem": {
        const before = await prisma.resourceItem.findUnique({ where: { id: body.payload.id } });
        await prisma.resourceItem.delete({ where: { id: body.payload.id } });
        await writeAudit(session, "ResourceItem", body.payload.id, "delete", before, null);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden: outside your organization's scope" }, { status: 403 });
    }
    throw err;
  }
}
