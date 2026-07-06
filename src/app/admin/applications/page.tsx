import { prisma } from "@/lib/prisma";
import ApplicationStatusSelect from "@/components/admin/ApplicationStatusSelect";

export default async function AdminApplicationsPage() {
  const applications = await prisma.application.findMany({
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
                  <ApplicationStatusSelect id={a.id} status={a.status} />
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Заявок пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
