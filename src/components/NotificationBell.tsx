"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { pickLocalized, t, type Locale } from "@/lib/i18n";

type NotificationItem = {
  id: string;
  title: string;
  titleKk: string | null;
  body: string;
  bodyKk: string | null;
  createdAt: string;
};

export default function NotificationBell({ locale, initialUnread }: { locale: Locale; initialUnread: number }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [unread, setUnread] = useState(initialUnread);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (!next) return;
    setLoading(true);
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setItems(data.items);
    setLoading(false);
    if (data.unread > 0) {
      await fetch("/api/notifications/read", { method: "POST" });
      setUnread(0);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label={t(locale, "notifications")}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10"
      >
        <Bell className="h-5 w-5" strokeWidth={2} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-xl border border-black/10 bg-white p-2 text-sm text-slate-800 shadow-xl">
          <p className="px-2 py-1 text-xs font-medium text-slate-400">{t(locale, "notifications")}</p>
          <div className="max-h-80 overflow-y-auto">
            {loading && <p className="px-2 py-3 text-xs text-slate-400">…</p>}
            {!loading && items && items.length === 0 && <p className="px-2 py-3 text-xs text-slate-400">{t(locale, "noNotifications")}</p>}
            {!loading &&
              items?.map((n) => (
                <div key={n.id} className="rounded-lg px-2 py-2 hover:bg-slate-50">
                  <p className="text-sm font-medium text-slate-800">{pickLocalized(n.title, n.titleKk, locale)}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{pickLocalized(n.body, n.bodyKk, locale)}</p>
                  <p className="mt-1 text-[11px] text-slate-300">{new Date(n.createdAt).toLocaleString("ru-RU")}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
