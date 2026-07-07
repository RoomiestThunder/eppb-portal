import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { toWizardField } from "@/lib/wizardMapper";
import { decryptString } from "@/lib/crypto";
import { getLocale, pickLocalized } from "@/lib/i18n";
import ApplicationWizard from "@/components/ApplicationWizard";

export default async function ContinueApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) notFound();
  const locale = await getLocale();

  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      service: {
        include: {
          stages: {
            orderBy: { order: "asc" },
            include: { steps: { orderBy: { order: "asc" }, include: { fields: { orderBy: { order: "asc" } } } } },
          },
        },
      },
    },
  });
  if (!app || app.userId !== session.userId) notFound();

  const nextStage = app.service.stages.find((s) => s.order === app.currentStageOrder + 1);
  if (!nextStage) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Дополнительные данные не требуются</h1>
        <p className="mt-2 text-slate-500">По этой заявке больше нет этапов, ожидающих ввода данных.</p>
        <Link href={`/cabinet/applications/${app.id}`} className="mt-4 inline-block text-brand hover:underline">
          ← К заявке
        </Link>
      </div>
    );
  }

  const lookupCodes = Array.from(
    new Set(nextStage.steps.flatMap((s) => s.fields.filter((f) => f.lookupCode).map((f) => f.lookupCode as string)))
  );
  const lookupRows = await prisma.lookup.findMany({ where: { code: { in: lookupCodes } }, include: { items: { orderBy: { order: "asc" } } } });
  const lookups = Object.fromEntries(
    lookupRows.map((l) => [l.code, l.items.map((i) => ({ value: i.value, label: pickLocalized(i.label, i.labelKk, locale) }))])
  );

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  const initialData = JSON.parse(decryptString(app.data)) as Record<string, unknown>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href={`/cabinet/applications/${app.id}`} className="text-sm text-slate-400 hover:text-brand">
        ← К заявке {app.number}
      </Link>
      <div className="mt-4">
        <ApplicationWizard
          serviceId={app.serviceId}
          serviceSlug={app.service.slug}
          serviceName={pickLocalized(app.service.name, app.service.nameKk, locale)}
          stageTitle={`Этап ${nextStage.order}. ${nextStage.title}`}
          steps={nextStage.steps.map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description,
            fields: s.fields.map((f) => toWizardField(f, locale)),
          }))}
          lookups={lookups}
          profile={{ bin: user?.bin ?? null, iin: user?.iin ?? null, fullName: user?.fullName ?? "" }}
          initialData={initialData}
          applicationId={app.id}
          targetStageOrder={nextStage.order}
        />
      </div>
    </div>
  );
}
