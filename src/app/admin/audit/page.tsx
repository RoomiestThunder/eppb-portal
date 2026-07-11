import Link from "next/link";
import { ScrollText, Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import EmptyState from "@/components/EmptyState";
import { diffFields, summarizeRecord } from "@/lib/auditDiff";

const ACTION_LABEL: Record<string, string> = {
  create: "создание",
  update: "изменение",
  delete: "удаление",
  publish: "публикация",
};
const ACTION_STYLE: Record<string, string> = {
  create: "bg-emerald-50 text-emerald-700",
  update: "bg-blue-50 text-blue-700",
  delete: "bg-red-50 text-red-600",
  publish: "bg-amber-50 text-amber-700",
};

const ENTITY_LABEL: Record<string, string> = {
  Service: "Услуга",
  ServiceStage: "Этап",
  ServiceStep: "Шаг",
  FormField: "Поле",
  Lookup: "Справочник",
  LookupItem: "Элемент справочника",
  AnalyticsMaterial: "Аналитический материал",
  Project: "Проект",
  ResourceItem: "Инструмент/материал",
};

const PAGE_SIZE = 20;

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [total, logs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Журнал изменений конструктора</h1>
          <p className="mt-1 text-slate-500">
            Кто, когда и что изменил в услугах, справочниках и заявках — обязательный audit trail для конструктора.
            Показаны только реально изменившиеся поля, без технических деталей.
          </p>
        </div>
        <a
          href="/api/admin/audit/export"
          className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:border-brand hover:text-brand"
        >
          <Download className="h-4 w-4" strokeWidth={2} />
          Скачать журнал (CSV)
        </a>
      </div>

      <div className="mt-6 space-y-2">
        {logs.map((l) => {
          const isCreate = l.action === "create";
          const isDelete = l.action === "delete";
          const diffs = !isCreate && !isDelete ? diffFields(l.before, l.after) : [];
          const summary = isCreate ? summarizeRecord(l.after) : isDelete ? summarizeRecord(l.before) : null;

          return (
            <details key={l.id} className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-800">{l.user.fullName}</span>
                  <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_STYLE[l.action] ?? "bg-slate-100 text-slate-600"}`}>
                    {ACTION_LABEL[l.action] ?? l.action}
                  </span>
                  <span className="text-slate-500">{ENTITY_LABEL[l.entityType] ?? l.entityType}</span>
                  {summary && summary !== "—" && <span className="text-slate-400">«{summary}»</span>}
                </span>
                <span className="whitespace-nowrap text-xs text-slate-400">{l.createdAt.toLocaleString("ru-RU")}</span>
              </summary>

              <div className="mt-3 border-t border-dashed border-black/10 pt-3">
                {(isCreate || isDelete) && (
                  <p className="text-xs text-slate-500">
                    {isCreate ? "Создана запись" : "Удалена запись"}: «{summary}»
                  </p>
                )}
                {!isCreate && !isDelete && (
                  <>
                    {diffs.length === 0 ? (
                      <p className="text-xs text-slate-400">Изменённых полей не обнаружено.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-slate-400">
                            <th className="py-1 pr-3 font-medium">Поле</th>
                            <th className="py-1 pr-3 font-medium">Было</th>
                            <th className="py-1 font-medium">Стало</th>
                          </tr>
                        </thead>
                        <tbody>
                          {diffs.map((d) => (
                            <tr key={d.key} className="border-t border-black/5">
                              <td className="py-1.5 pr-3 text-slate-500">{d.label}</td>
                              <td className="py-1.5 pr-3 text-red-500 line-through decoration-red-300">{d.before}</td>
                              <td className="py-1.5 text-emerald-700">{d.after}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
                )}
              </div>
            </details>
          );
        })}
        {logs.length === 0 && (
          <EmptyState icon={ScrollText} title="Изменений пока нет" description="Журнал заполнится по мере работы с конструктором." />
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <Link
            href={`/admin/audit?page=${page - 1}`}
            aria-disabled={page <= 1}
            className={`rounded-full border px-4 py-2 ${page <= 1 ? "pointer-events-none border-slate-100 text-slate-300" : "border-slate-300 text-slate-600 hover:border-brand hover:text-brand"}`}
          >
            ← Назад
          </Link>
          <span className="text-slate-400">
            Страница {page} из {totalPages} · всего записей: {total}
          </span>
          <Link
            href={`/admin/audit?page=${page + 1}`}
            aria-disabled={page >= totalPages}
            className={`rounded-full border px-4 py-2 ${page >= totalPages ? "pointer-events-none border-slate-100 text-slate-300" : "border-slate-300 text-slate-600 hover:border-brand hover:text-brand"}`}
          >
            Вперёд →
          </Link>
        </div>
      )}
    </div>
  );
}
