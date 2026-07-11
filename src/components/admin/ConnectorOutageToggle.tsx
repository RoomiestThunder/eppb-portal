"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BREAKER_LABEL: Record<string, string> = { closed: "работает", open: "отключен (circuit open)", "half-open": "проверка связи" };
const BREAKER_STYLE: Record<string, string> = {
  closed: "bg-emerald-50 text-emerald-700",
  open: "bg-red-50 text-red-600",
  "half-open": "bg-amber-50 text-amber-700",
};

export default function ConnectorOutageToggle({
  connector,
  breakerState,
  simulatedDown,
  readOnly = false,
}: {
  connector: string;
  breakerState: string;
  simulatedDown: boolean;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch("/api/admin/integrations/outage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connector, down: !simulatedDown }),
    });
    setLoading(false);
    router.refresh();
  }

  // The breaker only trips to "open" after real calls through it actually fail — right after
  // toggling the simulation, breakerState is still "closed" even though every next call will
  // throw. Show that primed-but-not-yet-tripped state explicitly instead of a stale "работает".
  const label = simulatedDown && breakerState === "closed" ? "симуляция сбоя (ждёт вызова)" : (BREAKER_LABEL[breakerState] ?? breakerState);
  const style = simulatedDown && breakerState === "closed" ? BREAKER_STYLE.open : (BREAKER_STYLE[breakerState] ?? BREAKER_STYLE.closed);

  return (
    <div className="mt-2 flex items-center justify-between">
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${style}`}>{label}</span>
      {!readOnly && (
        <button
          onClick={toggle}
          disabled={loading}
          className={`rounded-full px-3 py-1 text-[11px] font-medium ${simulatedDown ? "bg-red-600 text-white" : "border border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600"}`}
        >
          {simulatedDown ? "Восстановить связь" : "Симулировать сбой"}
        </button>
      )}
    </div>
  );
}
