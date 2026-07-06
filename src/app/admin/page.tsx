import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminHomePage() {
  const [servicesCount, applicationsCount, orgsCount, projectsCount, logsCount] = await Promise.all([
    prisma.service.count(),
    prisma.application.count(),
    prisma.organization.count(),
    prisma.project.count(),
    prisma.integrationLog.count(),
  ]);

  const cards = [
    { href: "/admin/constructor", title: "Конструктор услуг", desc: "Создание и изменение услуг, форм, шагов, логики без кода", value: servicesCount, label: "услуг" },
    { href: "/admin/applications", title: "Заявки", desc: "Просмотр и изменение статуса поступивших заявок", value: applicationsCount, label: "заявок" },
    { href: "/admin/lookups", title: "Справочники", desc: "Управление справочными данными для полей конструктора", value: 3, label: "справочника" },
    { href: "/admin/analytics", title: "Аналитическая отчетность", desc: "Каталог отчетов и дашбордов дочерних организаций", value: orgsCount, label: "организаций" },
    { href: "/admin/map", title: "Карта проектов", desc: "Управление проектами на интерактивной карте", value: projectsCount, label: "проектов" },
    { href: "/admin/integrations", title: "Интеграции", desc: "Журнал вызовов mock-интеграций (eGov, ЭЦП, BPM, ГБД)", value: logsCount, label: "событий" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Административный кабинет</h1>
      <p className="mt-1 text-slate-500">Управление контентом, услугами и настройками портала — без привлечения разработчиков.</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm hover:shadow-md">
            <p className="text-3xl font-bold text-brand">{c.value}</p>
            <p className="text-xs text-slate-400">{c.label}</p>
            <h2 className="mt-3 font-semibold text-slate-900">{c.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
