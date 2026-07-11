"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import RoleSwitcher from "@/components/RoleSwitcher";
import type { Session } from "@/lib/session";
import { ADMIN_ROLES } from "@/lib/roles";
import { t, type Locale } from "@/lib/i18n";

export default function MobileNav({
  nav,
  session,
  locale,
}: {
  nav: { href: string; label: string }[];
  session: Session | null;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="contents lg:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? (locale === "kk" ? "Мәзірді жабу" : "Закрыть меню") : locale === "kk" ? "Мәзірді ашу" : "Открыть меню"}
        aria-expanded={open}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white hover:bg-white/10"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-white/10 bg-brand-dark text-white shadow-lg">
          <nav className="flex flex-col p-4">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-white/90 hover:bg-white/10"
              >
                {n.label}
              </Link>
            ))}
            {session?.role === "CLIENT" && (
              <Link href="/cabinet" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-white/90 hover:bg-white/10">
                {t(locale, "cabinet")}
              </Link>
            )}
            {session && ADMIN_ROLES.includes(session.role) && (
              <Link href="/admin" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-white/90 hover:bg-white/10">
                {t(locale, "admin")}
              </Link>
            )}
          </nav>
          <div className="border-t border-white/10 p-4">
            <RoleSwitcher session={session} locale={locale} variant="mobile" />
          </div>
        </div>
      )}
    </div>
  );
}
