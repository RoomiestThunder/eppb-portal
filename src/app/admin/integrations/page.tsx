import { prisma } from "@/lib/prisma";

const CONNECTORS: { code: string; label: string; desc: string }[] = [
  { code: "egov_idp", label: "eGov IDP", desc: "Аутентификация пользователя и получение базовых данных профиля" },
  { code: "iin_bin_check", label: "ГБД ЮЛ/ФЛ (ИИН/БИН)", desc: "Проверка и получение данных заявителя по ИИН/БИН" },
  { code: "esign", label: "ЭЦП (НУЦ РК)", desc: "Подписание заявки и документов электронной цифровой подписью" },
  { code: "bpm_submit", label: "BPM дочерней организации — подача", desc: "Передача заявки во внутреннюю систему рассмотрения" },
  { code: "bpm_status", label: "BPM дочерней организации — статус", desc: "Получение статуса рассмотрения заявки" },
  { code: "doc_exchange", label: "Обмен документами", desc: "Передача и хранение приложенных файлов" },
  { code: "notify_sms", label: "Уведомления (SMS/Email)", desc: "Отправка уведомлений заявителю" },
];

export default async function AdminIntegrationsPage() {
  const logs = await prisma.integrationLog.findMany({ orderBy: { createdAt: "desc" }, take: 60 });
  const counts = Object.fromEntries(CONNECTORS.map((c) => [c.code, logs.filter((l) => l.connector === c.code).length]));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Интеграционное взаимодействие</h1>
      <p className="mt-1 text-slate-500">
        Реальная интеграция с гос./корпоративными системами на этапе конкурса не требуется. Ниже — mock-коннекторы и журнал
        вызовов, демонстрирующие готовность архитектуры к интеграции через Единую интеграционную шину Холдинга.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CONNECTORS.map((c) => (
          <div key={c.code} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-400">{counts[c.code] ?? 0} вызовов</span>
            </div>
            <h3 className="mt-2 font-medium text-slate-900">{c.label}</h3>
            <p className="mt-1 text-xs text-slate-500">{c.desc}</p>
            <p className="mt-2 font-mono text-[11px] text-slate-300">connector: {c.code} (mock)</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold text-slate-900">Журнал вызовов (последние 60)</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-black/5 text-left uppercase text-slate-400">
              <th className="px-4 py-3">Время</th>
              <th className="px-4 py-3">Коннектор</th>
              <th className="px-4 py-3">Направление</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Payload</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-black/5 last:border-0 align-top">
                <td className="whitespace-nowrap px-4 py-2 text-slate-400">{l.createdAt.toLocaleString("ru-RU")}</td>
                <td className="px-4 py-2 font-mono">{l.connector}</td>
                <td className="px-4 py-2">{l.direction === "request" ? "→ запрос" : "← ответ"}</td>
                <td className="px-4 py-2">
                  <span className={l.status === "ok" ? "text-emerald-600" : "text-red-600"}>{l.status}</span>
                </td>
                <td className="max-w-md px-4 py-2 font-mono text-[11px] text-slate-500">{l.payload}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Журнал пуст — интеграции сработают при подаче первой заявки
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
