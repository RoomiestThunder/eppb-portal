import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/statusLabels";
import { decryptString } from "@/lib/crypto";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) notFound();

  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      service: { include: { organization: true, stages: true } },
      history: { orderBy: { createdAt: "asc" } },
      documents: true,
    },
  });
  if (!app || app.userId !== session.userId) notFound();

  const data = JSON.parse(decryptString(app.data)) as Record<string, unknown>;
  const canContinue = app.status === "ADDITIONAL_INFO_REQUIRED" && app.service.stages.some((s) => s.order > app.currentStageOrder);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/cabinet" className="text-sm text-slate-400 hover:text-brand">
        ← Личный кабинет
      </Link>

      <div className="mt-4 rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-mono text-xs text-slate-400">{app.number}</p>
            <h1 className="text-xl font-semibold text-slate-900">{app.service.name}</h1>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLES[app.status]}`}>{STATUS_LABELS[app.status]}</span>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          {app.service.organization.name} · подана {app.createdAt.toLocaleString("ru-RU")}
        </p>

        {canContinue && (
          <Link
            href={`/cabinet/applications/${app.id}/continue`}
            className="mt-4 inline-block rounded-full bg-amber-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-600"
          >
            Предоставить расширенные данные →
          </Link>
        )}

        <h2 className="mt-8 font-semibold text-slate-900">История рассмотрения</h2>
        <ol className="mt-3 space-y-3 border-l-2 border-slate-100 pl-4">
          {app.history.map((h) => (
            <li key={h.id} className="relative">
              <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand" />
              <p className="text-sm text-slate-700">{h.message}</p>
              <p className="text-xs text-slate-400">{h.createdAt.toLocaleString("ru-RU")}</p>
            </li>
          ))}
        </ol>

        <h2 className="mt-8 font-semibold text-slate-900">Документы ({app.documents.length})</h2>
        <ul className="mt-3 space-y-2">
          {app.documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm">
              <span>📎 {d.fileName}</span>
              {d.signedEsign && <span className="text-xs text-emerald-600">подписан ЭЦП</span>}
            </li>
          ))}
          {app.documents.length === 0 && <p className="text-sm text-slate-400">Документов не приложено.</p>}
        </ul>

        <h2 className="mt-8 font-semibold text-slate-900">Данные заявки</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {Object.entries(data).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b border-dashed border-slate-100 py-1">
              <dt className="text-slate-400">{k}</dt>
              <dd className="text-right font-medium text-slate-700">{String(v)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
