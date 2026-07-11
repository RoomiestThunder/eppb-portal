"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";

function fmt(n: number) {
  return Number.isFinite(n) ? n.toLocaleString("ru-RU") : "—";
}

export default function CalculatorClient({ locale }: { locale: Locale }) {
  const [tab, setTab] = useState<"leasing" | "subsidy">("leasing");

  // leasing calculator state
  const [unitPrice, setUnitPrice] = useState(45000000);
  const [count, setCount] = useState(5);
  const [downPct, setDownPct] = useState(20);
  const [termMonths, setTermMonths] = useState(60);

  const totalPrice = unitPrice * count;
  const downAmount = Math.round((totalPrice * downPct) / 100);
  const monthly = Math.round((totalPrice - downAmount) / Math.max(1, termMonths));

  // subsidy calculator state
  const [headCount, setHeadCount] = useState(120);
  const [rate, setRate] = useState(45000);
  const subsidy = useMemo(() => Math.round(headCount * rate), [headCount, rate]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/tools" className="text-sm text-slate-400 hover:text-brand">
        ← {t(locale, "calcBackToTools")}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{t(locale, "calcTitle")}</h1>
      <p className="mt-1 text-slate-500">{t(locale, "calcSubtitle")}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={() => setTab("leasing")} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${tab === "leasing" ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`}>
          {t(locale, "calcTabLeasing")}
        </button>
        <button onClick={() => setTab("subsidy")} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${tab === "subsidy" ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`}>
          {t(locale, "calcTabSubsidy")}
        </button>
      </div>

      {tab === "leasing" && (
        <div className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-slate-500">{t(locale, "calcUnitPrice")}</span>
              <input type="number" value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2" />
            </label>
            <label className="block">
              <span className="text-sm text-slate-500">{t(locale, "calcCount")}</span>
              <input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2" />
            </label>
            <label className="block">
              <span className="text-sm text-slate-500">{t(locale, "calcDownPct")}</span>
              <input type="number" value={downPct} onChange={(e) => setDownPct(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2" />
            </label>
            <label className="block">
              <span className="text-sm text-slate-500">{t(locale, "calcTermMonths")}</span>
              <input type="number" value={termMonths} onChange={(e) => setTermMonths(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2" />
            </label>
          </div>
          <dl className="mt-6 space-y-2 rounded-xl bg-brand/5 p-4 text-sm">
            <div className="flex justify-between">
              <dt>{t(locale, "calcTotalPrice")}</dt>
              <dd className="font-mono font-semibold text-brand">{fmt(totalPrice)} ₸</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t(locale, "calcDownAmount")}</dt>
              <dd className="font-mono font-semibold text-brand">{fmt(downAmount)} ₸</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t(locale, "calcMonthly")}</dt>
              <dd className="font-mono font-semibold text-brand">{fmt(monthly)} ₸</dd>
            </div>
          </dl>
          <Link href="/services/wagon-leasing" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
            {t(locale, "calcGoToLeasingApply")} →
          </Link>
        </div>
      )}

      {tab === "subsidy" && (
        <div className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-slate-500">{t(locale, "calcHeadCount")}</span>
              <input type="number" value={headCount} onChange={(e) => setHeadCount(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2" />
            </label>
            <label className="block">
              <span className="text-sm text-slate-500">{t(locale, "calcRatePerHead")}</span>
              <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2" />
            </label>
          </div>
          <dl className="mt-6 rounded-xl bg-brand/5 p-4 text-sm">
            <div className="flex justify-between">
              <dt>{t(locale, "calcSubsidyAmount")}</dt>
              <dd className="font-mono font-semibold text-brand">{fmt(subsidy)} ₸</dd>
            </div>
          </dl>
          <Link href="/services/agro-livestock" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
            {t(locale, "calcGoToSubsidyApply")} →
          </Link>
        </div>
      )}
    </div>
  );
}
