import Link from "next/link";
import { getSession, ADMIN_ROLES } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import LoginPrompt from "@/components/LoginPrompt";

const NAV = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/builder", label: "Конструктор услуг" },
  { href: "/admin/applications", label: "Заявки" },
  { href: "/admin/lookups", label: "Справочники" },
  { href: "/admin/analytics", label: "Аналитика ДО" },
  { href: "/admin/map", label: "Карта проектов" },
  { href: "/admin/resources", label: "Инструменты бизнеса" },
  { href: "/admin/integrations", label: "Интеграции" },
  { href: "/admin/audit", label: "Журнал изменений" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Административный кабинет</h1>
        <p className="mt-2 text-slate-500">Войдите как администратор, автор услуг или аналитик, чтобы управлять порталом.</p>
        <LoginPrompt />
      </div>
    );
  }

  const org = session.organizationId ? await prisma.organization.findUnique({ where: { id: session.organizationId } }) : null;

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <aside className="hidden w-56 shrink-0 md:block">
        <p className="mb-3 px-3 text-xs uppercase tracking-wide text-slate-400">Админ-панель</p>
        {org && (
          <p className="mb-3 rounded-lg bg-brand/5 px-3 py-2 text-xs text-brand">
            Область видимости: <span className="font-medium">{org.shortName}</span>
          </p>
        )}
        {session.role === "ANALYST" && (
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">Режим «только чтение»</p>
        )}
        <nav className="space-y-1">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-brand/5 hover:text-brand">
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
