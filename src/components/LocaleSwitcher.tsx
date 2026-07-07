"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";

export default function LocaleSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function switchTo(next: Locale) {
    if (next === locale || loading) return;
    setLoading(true);
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center overflow-hidden rounded-full border border-white/20 text-xs font-medium">
      <button
        onClick={() => switchTo("ru")}
        className={`px-2.5 py-1 transition ${locale === "ru" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"}`}
      >
        РУС
      </button>
      <button
        onClick={() => switchTo("kk")}
        className={`px-2.5 py-1 transition ${locale === "kk" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"}`}
      >
        ҚАЗ
      </button>
    </div>
  );
}
