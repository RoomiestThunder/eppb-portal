import { prisma } from "@/lib/prisma";

const ACTION_LABEL: Record<string, string> = {
  create: "создание",
  update: "изменение",
  delete: "удаление",
  publish: "публикация",
};

export default async function AdminAuditPage() {
  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Журнал изменений конструктора</h1>
      <p className="mt-1 text-slate-500">
        Кто, когда и что изменил в услугах, справочниках и заявках — обязательный audit trail для конструктора.
      </p>

      <div className="mt-6 space-y-2">
        {logs.map((l) => (
          <details key={l.id} className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
            <summary className="flex cursor-pointer items-center justify-between text-sm">
              <span>
                <span className="font-medium text-slate-800">{l.user.fullName}</span>{" "}
                <span className="text-slate-500">
                  {ACTION_LABEL[l.action] ?? l.action} · {l.entityType}
                </span>
              </span>
              <span className="text-xs text-slate-400">{l.createdAt.toLocaleString("ru-RU")}</span>
            </summary>
            <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
              <div>
                <p className="mb-1 font-medium text-slate-500">До</p>
                <pre className="max-h-40 overflow-auto rounded-lg bg-slate-50 p-2 text-slate-600">{l.before ?? "—"}</pre>
              </div>
              <div>
                <p className="mb-1 font-medium text-slate-500">После</p>
                <pre className="max-h-40 overflow-auto rounded-lg bg-slate-50 p-2 text-slate-600">{l.after ?? "—"}</pre>
              </div>
            </div>
          </details>
        ))}
        {logs.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
            Изменений пока нет — журнал заполнится по мере работы с конструктором.
          </p>
        )}
      </div>
    </div>
  );
}
