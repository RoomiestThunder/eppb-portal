"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import type { Session } from "@/lib/session";
import { ADMIN_ROLES, type Role } from "@/lib/roles";
import { t, type Locale } from "@/lib/i18n";

const ROLE_LABEL_KEY: Record<Role, "roleClient" | "roleSuperadmin" | "roleOrgAdmin" | "roleAuthor" | "roleAnalyst"> = {
  CLIENT: "roleClient",
  SUPERADMIN: "roleSuperadmin",
  ORG_ADMIN: "roleOrgAdmin",
  AUTHOR: "roleAuthor",
  ANALYST: "roleAnalyst",
};

const LOGIN_OPTIONS: { role: Role; ru: string; kk: string }[] = [
  { role: "CLIENT", ru: "Войти как предприниматель", kk: "Кәсіпкер ретінде кіру" },
  { role: "AUTHOR", ru: "Войти как автор услуг", kk: "Қызмет авторы ретінде кіру" },
  { role: "ORG_ADMIN", ru: "Войти как администратор ДО", kk: "ЕҰ әкімшісі ретінде кіру" },
  { role: "SUPERADMIN", ru: "Войти как суперадминистратор", kk: "Супер әкімші ретінде кіру" },
  { role: "ANALYST", ru: "Войти как аналитик (только чтение)", kk: "Аналитик ретінде кіру (тек оқу)" },
];

export default function RoleSwitcher({
  session,
  locale = "ru",
  variant = "header",
}: {
  session: Session | null;
  locale?: Locale;
  variant?: "header" | "mobile";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function loginAs(role: Role) {
    setLoading(true);
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setLoading(false);
    setOpen(false);
    router.push(ADMIN_ROLES.includes(role) ? "/admin" : "/cabinet");
    router.refresh();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const isMobile = variant === "mobile";

  return (
    <div className={isMobile ? "flex items-center gap-2" : "relative"} ref={isMobile ? undefined : ref}>
      <div className={isMobile ? "relative min-w-0 flex-1" : undefined} ref={isMobile ? ref : undefined}>
        <button
          onClick={() => setOpen((v) => !v)}
          className={
            isMobile
              ? "flex w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white transition hover:bg-white/20"
              : "flex max-w-[9rem] items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white transition hover:bg-white/20 sm:max-w-[14rem]"
          }
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
          <span className={isMobile ? "truncate" : "truncate"}>{session ? session.fullName : t(locale, "login")}</span>
        </button>
        {open && (
          <div
            className={
              isMobile
                ? "absolute left-0 right-0 z-50 mt-2 rounded-xl border border-black/10 bg-white p-2 text-sm text-slate-800 shadow-xl"
                : "absolute right-0 z-50 mt-2 w-72 rounded-xl border border-black/10 bg-white p-2 text-sm text-slate-800 shadow-xl"
            }
          >
            {session && <p className="px-2 py-1 text-xs font-medium text-brand">{t(locale, ROLE_LABEL_KEY[session.role])}</p>}
            <p className="px-2 py-1 text-xs text-slate-400">
              {locale === "kk" ? "Нақты eGov IDP-сіз демо-кіру" : "Демо-вход без реального eGov IDP"}
            </p>
            {LOGIN_OPTIONS.map((o) => (
              <button
                key={o.role}
                disabled={loading}
                onClick={() => loginAs(o.role)}
                className="block w-full rounded-lg px-2 py-2 text-left hover:bg-slate-100"
              >
                {locale === "kk" ? o.kk : o.ru}
              </button>
            ))}
            {session && !isMobile && (
              <button onClick={logout} className="mt-1 block w-full rounded-lg px-2 py-2 text-left text-red-600 hover:bg-red-50">
                {t(locale, "logout")}
              </button>
            )}
          </div>
        )}
      </div>
      {session && isMobile && (
        <button
          onClick={logout}
          className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white transition hover:bg-white/20"
        >
          {t(locale, "logout")}
        </button>
      )}
    </div>
  );
}
