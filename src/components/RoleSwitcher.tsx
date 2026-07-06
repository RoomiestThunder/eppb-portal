"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import type { Session } from "@/lib/session";

const ROLE_LABELS: Record<Session["role"], string> = {
  CLIENT: "Предприниматель",
  ADMIN: "Администратор",
  AUTHOR: "Автор услуг",
};

export default function RoleSwitcher({ session }: { session: Session | null }) {
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

  async function loginAs(role: Session["role"]) {
    setLoading(true);
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setLoading(false);
    setOpen(false);
    router.push(role === "ADMIN" || role === "AUTHOR" ? "/admin" : "/cabinet");
    router.refresh();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20 transition"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        {session ? `${session.fullName} · ${ROLE_LABELS[session.role]}` : "Войти (демо eGov IDP)"}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-black/10 bg-white p-2 text-sm text-slate-800 shadow-xl">
          <p className="px-2 py-1 text-xs text-slate-400">Демо-вход без реального eGov IDP</p>
          <button
            disabled={loading}
            onClick={() => loginAs("CLIENT")}
            className="block w-full rounded-lg px-2 py-2 text-left hover:bg-slate-100"
          >
            Войти как предприниматель
          </button>
          <button
            disabled={loading}
            onClick={() => loginAs("AUTHOR")}
            className="block w-full rounded-lg px-2 py-2 text-left hover:bg-slate-100"
          >
            Войти как автор услуг
          </button>
          <button
            disabled={loading}
            onClick={() => loginAs("ADMIN")}
            className="block w-full rounded-lg px-2 py-2 text-left hover:bg-slate-100"
          >
            Войти как администратор
          </button>
          {session && (
            <button onClick={logout} className="mt-1 block w-full rounded-lg px-2 py-2 text-left text-red-600 hover:bg-red-50">
              Выйти
            </button>
          )}
        </div>
      )}
    </div>
  );
}
