import Link from "next/link";
import RoleSwitcher from "@/components/RoleSwitcher";
import type { Session } from "@/lib/session";
import { ADMIN_ROLES } from "@/lib/roles";

const NAV = [
  { href: "/services", label: "Каталог услуг" },
  { href: "/analytics", label: "Аналитика ДО" },
  { href: "/map", label: "Карта проектов" },
  { href: "/tools", label: "Инструменты бизнеса" },
];

export default function Header({ session }: { session: Session | null }) {
  return (
    <header className="sticky top-0 z-40 bg-brand text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-brand-dark font-bold">Е</span>
          <span className="leading-tight">
            <span className="block text-base">ЕППБ</span>
            <span className="block text-[11px] font-normal text-white/70">Единый портал поддержки бизнеса</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-white/85 transition hover:text-white">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {session?.role === "CLIENT" && (
            <Link href="/cabinet" className="hidden rounded-full bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20 sm:block">
              Личный кабинет
            </Link>
          )}
          {session && ADMIN_ROLES.includes(session.role) && (
            <Link href="/admin" className="hidden rounded-full bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20 sm:block">
              Админ-панель
            </Link>
          )}
          <RoleSwitcher session={session} />
        </div>
      </div>
    </header>
  );
}
