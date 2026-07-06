import Link from "next/link";
import { getSession } from "@/lib/session";
import LoginPrompt from "@/components/LoginPrompt";

const NAV = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/constructor", label: "Конструктор услуг" },
  { href: "/admin/applications", label: "Заявки" },
  { href: "/admin/lookups", label: "Справочники" },
  { href: "/admin/analytics", label: "Аналитика ДО" },
  { href: "/admin/map", label: "Карта проектов" },
  { href: "/admin/resources", label: "Инструменты бизнеса" },
  { href: "/admin/integrations", label: "Интеграции" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "AUTHOR")) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Административный кабинет</h1>
        <p className="mt-2 text-slate-500">Войдите как администратор или автор услуг, чтобы управлять порталом.</p>
        <LoginPrompt />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <aside className="hidden w-56 shrink-0 md:block">
        <p className="mb-3 px-3 text-xs uppercase tracking-wide text-slate-400">Админ-панель</p>
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
