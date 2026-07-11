import Link from "next/link";
import { Inbox, BellOff } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import LoginPrompt from "@/components/LoginPrompt";
import EmptyState from "@/components/EmptyState";
import { getStatusLabel, STATUS_STYLES } from "@/lib/statusLabels";
import { pickLocalized, t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export default async function CabinetPage() {
  const session = await getSession();
  const locale = await getLocale();
  if (!session || session.role !== "CLIENT") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">{t(locale, "cabinetLoginTitle")}</h1>
        <p className="mt-2 text-slate-500">{t(locale, "cabinetLoginBody")}</p>
        <LoginPrompt locale={locale} />
      </div>
    );
  }

  const [applications, notifications, user] = await Promise.all([
    prisma.application.findMany({
      where: { userId: session.userId },
      include: { service: { include: { organization: true, stages: true } }, documents: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.user.findUnique({ where: { id: session.userId } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">{t(locale, "cabinetTitle")}</h1>
      <p className="mt-1 text-slate-500">
        {user?.fullName} {user?.bin && <>· БИН/ИИН {user.bin}</>}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">
            {t(locale, "myApplications")} ({applications.length})
          </h2>
          <div className="mt-4 space-y-4">
            {applications.map((app) => {
              const canContinue =
                app.status === "ADDITIONAL_INFO_REQUIRED" && app.service.stages.some((s) => s.order > app.currentStageOrder);
              return (
                <div key={app.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs text-slate-400">{app.number}</p>
                      <Link href={`/cabinet/applications/${app.id}`} className="font-medium text-slate-900 hover:text-brand">
                        {pickLocalized(app.service.name, app.service.nameKk, locale)}
                      </Link>
                    </div>
                    <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[app.status]}`}>
                      {getStatusLabel(app.status, locale)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <span>
                      {app.service.organization.shortName} · {t(locale, app.status === "DRAFT" ? "createdOn" : "submittedOn")}{" "}
                      {app.createdAt.toLocaleDateString("ru-RU")} · {t(locale, "documentsWord")}: {app.documents.length}
                    </span>
                    <div className="flex gap-3">
                      {app.status === "DRAFT" ? (
                        <Link href={`/services/${app.service.slug}/apply`} className="whitespace-nowrap font-medium text-brand hover:underline">
                          {t(locale, "continueDraft")} →
                        </Link>
                      ) : (
                        <Link href={`/cabinet/applications/${app.id}`} className="whitespace-nowrap font-medium text-brand hover:underline">
                          {t(locale, "details")}
                        </Link>
                      )}
                      {canContinue && (
                        <Link
                          href={`/cabinet/applications/${app.id}/continue`}
                          className="whitespace-nowrap font-medium text-amber-700 hover:underline"
                        >
                          {t(locale, "submitExtra")} →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {applications.length === 0 && (
              <EmptyState
                icon={Inbox}
                title={t(locale, "noApplicationsTitle")}
                description={t(locale, "noApplicationsBody")}
                action={{ href: "/services", label: t(locale, "goToCatalog") }}
              />
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t(locale, "notifications")}</h2>
          <div className="mt-4 space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-800">{n.title}</p>
                <p className="mt-1 text-xs text-slate-500">{n.body}</p>
                <p className="mt-2 text-[11px] text-slate-300">{n.createdAt.toLocaleString("ru-RU")}</p>
              </div>
            ))}
            {notifications.length === 0 && <EmptyState icon={BellOff} title={t(locale, "noNotifications")} />}
          </div>
        </div>
      </div>
    </div>
  );
}
