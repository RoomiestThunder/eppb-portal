"use client";

import { useState } from "react";
import { t, type Locale } from "@/lib/i18n";

export type AnalyticsMaterialVM = {
  id: string;
  title: string;
  description: string;
  orgName: string;
  orgColor: string;
  typeLabel: string;
  source: string;
  period: string;
  linkUrl: string;
  embeddable: boolean;
};

export default function AnalyticsCard({ material: m, locale }: { material: AnalyticsMaterialVM; locale: Locale }) {
  const [preview, setPreview] = useState(false);

  return (
    <div className="flex flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium text-white" style={{ backgroundColor: m.orgColor }}>
          {m.orgName}
        </span>
        <span className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-500">{m.typeLabel}</span>
      </div>
      <h3 className="mt-3 font-semibold text-slate-900">{m.title}</h3>
      <p className="mt-1 flex-1 text-sm text-slate-500">{m.description}</p>
      <dl className="mt-3 space-y-1 text-xs text-slate-400">
        <div className="flex justify-between">
          <dt>{t(locale, "sourceLabel")}</dt>
          <dd>{m.source}</dd>
        </div>
        <div className="flex justify-between">
          <dt>{t(locale, "periodLabel")}</dt>
          <dd>{m.period}</dd>
        </div>
      </dl>

      {m.embeddable && preview && (
        <div className="mt-3 rounded-xl border border-black/5 bg-slate-50 p-4">
          <div className="flex h-24 items-end gap-2">
            {[45, 70, 55, 90, 65, 80, 50].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-brand/60" style={{ height: `${h}%` }} />
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            {t(locale, "previewCaption")} {m.source}.
          </p>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {m.embeddable && (
          <button onClick={() => setPreview((v) => !v)} className="whitespace-nowrap rounded-full bg-brand/10 px-4 py-2 text-sm font-medium text-brand hover:bg-brand/20">
            {preview ? t(locale, "hidePreview") : t(locale, "embedPreview")}
          </button>
        )}
        <a href={m.linkUrl} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-brand hover:text-brand">
          {t(locale, "openSource")} →
        </a>
      </div>
    </div>
  );
}
