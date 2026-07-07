import { FileStack } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession, ORG_SCOPED_ROLES } from "@/lib/session";
import { STATUS_LABELS } from "@/lib/statusLabels";
import ApplicationStatusSelect from "@/components/admin/ApplicationStatusSelect";
import EmptyState from "@/components/EmptyState";

export default async function AdminApplicationsPage() {
  const session = await getSession();
  const scoped = session && ORG_SCOPED_ROLES.includes(session.role);
  const readOnly = session?.role === "ANALYST";

  const applications = await prisma.application.findMany({
    where: scoped ? { service: { organizationId: session!.organizationId! } } : undefined,
    include: { service: { include: { organization: true } }, user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Заявки</h1>
      <p className="mt-1 text-slate-500">
        Просмотр заявок и изменение статуса — в проде маршрутизация выполняется в BPM дочерних организаций,
        ЕППБ синхронизирует статус и уведомляет заявителя.
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 text-left text-xs uppercase text-slate-400">
              <th className="px-4 py-3">Номер</th>
              <th className="px-4 py-3">Услуга</th>
              <th className="px-4 py-3">Заявитель</th>
              <th className="px-4 py-3">Организация</th>
              <th className="px-4 py-3">Подана</th>
              <th className="px-4 py-3">Статус</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((a) => (
              <tr key={a.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{a.number}</td>
                <td className="px-4 py-3">{a.service.name}</td>
                <td className="px-4 py-3">{a.user.fullName}</td>
                <td className="px-4 py-3">{a.service.organization.shortName}</td>
                <td className="px-4 py-3 text-xs text-slate-400">{a.createdAt.toLocaleDateString("ru-RU")}</td>
                <td className="px-4 py-3">
                  {readOnly ? (
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">{STATUS_LABELS[a.status]}</span>
                  ) : (
                    <ApplicationStatusSelect id={a.id} status={a.status} />
                  )}
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={6} className="border-none p-0">
                  <EmptyState icon={FileStack} title="Заявок пока нет" description="Они появятся здесь сразу после первой подачи." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
