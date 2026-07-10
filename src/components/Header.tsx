import Link from "next/link";
import Image from "next/image";
import RoleSwitcher from "@/components/RoleSwitcher";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import MobileNav from "@/components/MobileNav";
import type { Session } from "@/lib/session";
import { ADMIN_ROLES } from "@/lib/roles";
import { t, type Locale } from "@/lib/i18n";

export default function Header({ session, locale }: { session: Session | null; locale: Locale }) {
  const NAV = [
    { href: "/services", label: t(locale, "catalog") },
    { href: "/analytics", label: t(locale, "analytics") },
    { href: "/map", label: t(locale, "map") },
    { href: "/tools", label: t(locale, "tools") },
  ];

  return (
    <header className="sticky top-0 z-40 bg-brand text-white shadow-md">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold">
          <span className="relative h-9 w-9 shrink-0">
            <Image src="/brand/baiterek-icon.png" alt="" fill sizes="36px" className="object-contain" />
          </span>
          <span className="leading-tight">
            <span className="block whitespace-nowrap text-base">ЕППБ</span>
            <span className="hidden whitespace-nowrap text-[11px] font-normal text-white/70 sm:block">{t(locale, "heroTitle")}</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-5 whitespace-nowrap text-sm lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-white/85 transition hover:text-white">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <LocaleSwitcher locale={locale} />
          {session?.role === "CLIENT" && (
            <Link href="/cabinet" className="whitespace-nowrap rounded-full bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">
              {t(locale, "cabinet")}
            </Link>
          )}
          {session && ADMIN_ROLES.includes(session.role) && (
            <Link href="/admin" className="whitespace-nowrap rounded-full bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">
              {t(locale, "admin")}
            </Link>
          )}
          <RoleSwitcher session={session} locale={locale} />
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <LocaleSwitcher locale={locale} />
          <MobileNav nav={NAV} session={session} locale={locale} />
        </div>
      </div>
    </header>
  );
}
