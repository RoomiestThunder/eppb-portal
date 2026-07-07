import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { toWizardField } from "@/lib/wizardMapper";
import { decryptString } from "@/lib/crypto";
import ApplicationWizard from "@/components/ApplicationWizard";
import LoginPrompt from "@/components/LoginPrompt";

export default async function ApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getSession();

  const service = await prisma.service.findUnique({
    where: { slug },
    include: {
      stages: {
        orderBy: { order: "asc" },
        take: 1,
        include: { steps: { orderBy: { order: "asc" }, include: { fields: { orderBy: { order: "asc" } } } } },
      },
    },
  });
  if (!service) notFound();

  if (!session || session.role !== "CLIENT") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Нужно войти как предприниматель</h1>
        <p className="mt-2 text-slate-500">
          Для подачи заявки на услугу «{service.name}» выполните вход через демо-имитацию eGov IDP.
        </p>
        <LoginPrompt />
        <Link href={`/services/${slug}`} className="mt-4 inline-block text-sm text-brand hover:underline">
          ← Назад к услуге
        </Link>
      </div>
    );
  }

  const stage = service.stages[0];
  const lookupCodes = Array.from(
    new Set(stage.steps.flatMap((s) => s.fields.filter((f) => f.lookupCode).map((f) => f.lookupCode as string)))
  );
  const lookupRows = await prisma.lookup.findMany({ where: { code: { in: lookupCodes } }, include: { items: { orderBy: { order: "asc" } } } });
  const lookups = Object.fromEntries(lookupRows.map((l) => [l.code, l.items.map((i) => ({ value: i.value, label: i.label }))]));

  const user = await prisma.user.findUnique({ where: { id: session.userId } });

  // Resume an autosaved draft for this service, if one exists, instead of starting from scratch.
  const draft = await prisma.application.findFirst({
    where: { serviceId: service.id, userId: session.userId, status: "DRAFT" },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <ApplicationWizard
        serviceId={service.id}
        serviceSlug={service.slug}
        serviceName={service.name}
        stageTitle={`Этап 1. ${stage.title}`}
        steps={stage.steps.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          fields: s.fields.map(toWizardField),
        }))}
        lookups={lookups}
        profile={{ bin: user?.bin ?? null, iin: user?.iin ?? null, fullName: user?.fullName ?? "" }}
        initialData={draft ? (JSON.parse(decryptString(draft.data)) as Record<string, unknown>) : undefined}
        draftId={draft?.id}
      />
    </div>
  );
}
