"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { computeVisibleFieldsWithCalculations, type FieldLike } from "@/lib/ruleEngine";
import { checkApplicationCompleteness } from "@/lib/ai";

export type WizardField = FieldLike & {
  label: string;
  hint: string;
  required: boolean;
  options: string[];
  lookupCode: string | null;
  validation: { min?: number; max?: number; minLength?: number; maxLength?: number; pattern?: string } | null;
  prefillSource: string | null;
};

export type WizardStep = { id: string; title: string; description: string; fields: WizardField[] };

export default function ApplicationWizard({
  serviceId,
  serviceSlug,
  serviceName,
  stageTitle,
  steps,
  lookups,
  profile,
  initialData,
  applicationId,
  targetStageOrder,
}: {
  serviceId: string;
  serviceSlug: string;
  serviceName: string;
  stageTitle: string;
  steps: WizardStep[];
  lookups: Record<string, { value: string; label: string }[]>;
  profile: { bin: string | null; iin: string | null; fullName: string };
  initialData?: Record<string, unknown>;
  applicationId?: string;
  targetStageOrder?: number;
}) {
  const router = useRouter();
  const allFields = useMemo(() => steps.flatMap((s) => s.fields), [steps]);

  const [formData, setFormData] = useState<Record<string, unknown>>(() => ({ ...(initialData ?? {}) }));
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [aiIssues, setAiIssues] = useState<string[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ number: string } | null>(null);
  const [binLookupDone, setBinLookupDone] = useState(false);

  const { visible, enrichedData } = useMemo(() => computeVisibleFieldsWithCalculations(allFields, formData), [allFields, formData]);
  const visibleIds = useMemo(() => new Set(visible.map((f) => f.id)), [visible]);

  const step = steps[stepIndex];
  const stepFields = step.fields.filter((f) => visibleIds.has(f.id));

  const companyNameFieldKeys = useMemo(
    () => allFields.filter((f) => f.prefillSource === "egov.companyName").map((f) => f.key),
    [allFields]
  );
  const binFieldKeys = useMemo(() => allFields.filter((f) => f.prefillSource === "egov.bin").map((f) => f.key), [allFields]);

  const runBinLookup = useCallback(
    async (bin: string) => {
      if (!bin || bin.length < 8 || companyNameFieldKeys.length === 0) return;
      try {
        const res = await fetch("/api/mock/bin-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: bin }),
        });
        const data = await res.json();
        if (data.companyName) {
          setFormData((prev) => {
            const next = { ...prev };
            for (const key of companyNameFieldKeys) if (!next[key]) next[key] = data.companyName;
            return next;
          });
        }
      } catch {
        // mock integration best-effort — ignore failures in demo
      }
    },
    [companyNameFieldKeys]
  );

  // Auto-prefill from mock eGov IDP profile on first load
  useEffect(() => {
    if (binLookupDone) return;
    if (binFieldKeys.length > 0 && profile.bin) {
      setFormData((prev) => {
        const next = { ...prev };
        for (const key of binFieldKeys) if (!next[key]) next[key] = profile.bin as string;
        return next;
      });
      runBinLookup(profile.bin);
      setBinLookupDone(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [binFieldKeys, profile.bin, binLookupDone]);

  function setValue(key: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function validateStep(): string[] {
    const issues: string[] = [];
    for (const f of stepFields) {
      if (!f.required || f.type === "INFO" || f.type === "CALCULATED") continue;
      const v = enrichedData[f.key];
      const empty = v === undefined || v === null || v === "";
      if (empty) issues.push(`«${f.label}» — обязательное поле`);
      else if (f.type === "NUMBER") {
        const n = Number(v);
        if (Number.isNaN(n)) issues.push(`«${f.label}» — должно быть числом`);
        else {
          if (f.validation?.min !== undefined && n < f.validation.min) issues.push(`«${f.label}» — минимум ${f.validation.min}`);
          if (f.validation?.max !== undefined && n > f.validation.max) issues.push(`«${f.label}» — максимум ${f.validation.max}`);
        }
      }
    }
    return issues;
  }

  function goNext() {
    const issues = validateStep();
    setErrors(issues);
    if (issues.length > 0) return;
    setAiIssues(null);
    if (stepIndex < steps.length - 1) setStepIndex((i) => i + 1);
  }

  function goBack() {
    setErrors([]);
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function runAiCheck() {
    const issues = checkApplicationCompleteness(
      visible.map((f) => ({ key: f.key, label: f.label, required: f.required, type: f.type })),
      enrichedData
    );
    setAiIssues(issues.length === 0 ? [] : issues.map((i) => `«${i.label}»: ${i.message}`));
  }

  async function submit() {
    const issues = validateStep();
    setErrors(issues);
    if (issues.length > 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, data: enrichedData, applicationId, targetStageOrder }),
      });
      if (!res.ok) throw new Error("submit failed");
      const data = await res.json();
      setResult({ number: data.number });
    } catch {
      setErrors(["Не удалось отправить заявку. Попробуйте ещё раз."]);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl">✅</div>
        <h2 className="mt-4 text-xl font-semibold text-slate-900">Заявка отправлена</h2>
        <p className="mt-2 text-slate-600">
          Номер заявки: <span className="font-mono font-semibold">{result.number}</span>
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Заявка передана на рассмотрение{applicationId ? "" : " и подписана ЭЦП (mock)"}. Статус и уведомления доступны в личном кабинете.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => router.push("/cabinet")} className="rounded-full bg-brand px-5 py-2.5 text-white hover:bg-brand-dark">
            Перейти в личный кабинет
          </button>
          <button onClick={() => router.push(`/services/${serviceSlug}`)} className="rounded-full border border-slate-300 px-5 py-2.5 text-slate-600 hover:bg-white">
            К услуге
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm text-slate-400">{serviceName} · {stageTitle}</p>
      <div className="mt-2 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.id} className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-brand" : "bg-slate-200"}`} />
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Шаг {stepIndex + 1} из {steps.length}
      </p>

      <div className="mt-4 rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{step.title}</h2>
        {step.description && <p className="mt-1 text-sm text-slate-500">{step.description}</p>}

        <div className="mt-6 space-y-5">
          {stepFields.map((f) => (
            <FieldInput
              key={f.id}
              field={f}
              value={enrichedData[f.key]}
              onChange={(v) => setValue(f.key, v)}
              onBlurBin={binFieldKeys.includes(f.key) ? () => runBinLookup(String(enrichedData[f.key] ?? "")) : undefined}
              lookupItems={f.lookupCode ? lookups[f.lookupCode] ?? [] : []}
            />
          ))}
        </div>

        {errors.length > 0 && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <ul className="list-inside list-disc space-y-0.5">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {stepIndex === steps.length - 1 && (
          <div className="mt-5">
            <button onClick={runAiCheck} className="rounded-full border border-brand/30 px-4 py-2 text-sm text-brand hover:bg-brand/5">
              ✨ Проверить заявку с помощью AI
            </button>
            {aiIssues && (
              <div className={`mt-3 rounded-xl p-4 text-sm ${aiIssues.length === 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {aiIssues.length === 0 ? (
                  "AI-проверка: заявка выглядит полной и готова к отправке."
                ) : (
                  <ul className="list-inside list-disc space-y-0.5">
                    {aiIssues.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button
            onClick={goBack}
            disabled={stepIndex === 0}
            className="rounded-full border border-slate-300 px-5 py-2.5 text-slate-600 disabled:opacity-30"
          >
            Назад
          </button>
          {stepIndex < steps.length - 1 ? (
            <button onClick={goNext} className="rounded-full bg-brand px-6 py-2.5 text-white hover:bg-brand-dark">
              Далее
            </button>
          ) : (
            <button onClick={submit} disabled={submitting} className="rounded-full bg-brand px-6 py-2.5 text-white hover:bg-brand-dark disabled:opacity-50">
              {submitting ? "Отправка…" : "Отправить заявку"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  onBlurBin,
  lookupItems,
}: {
  field: WizardField;
  value: unknown;
  onChange: (v: unknown) => void;
  onBlurBin?: () => void;
  lookupItems: { value: string; label: string }[];
}) {
  const base = "w-full rounded-xl border border-black/10 px-3.5 py-2.5 outline-none focus:border-brand";

  if (field.type === "INFO") {
    return (
      <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
        <p>{field.label}</p>
      </div>
    );
  }

  if (field.type === "CALCULATED") {
    const num = typeof value === "number" ? value : Number(value);
    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">{field.label}</label>
        <div className="rounded-xl border border-dashed border-brand/30 bg-brand/5 px-3.5 py-2.5 font-mono text-brand">
          {Number.isFinite(num) ? num.toLocaleString("ru-RU") : "—"}
        </div>
        {field.hint && <p className="mt-1 text-xs text-slate-400">{field.hint}</p>}
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
      </label>
      {field.type === "TEXT" && (
        <input
          className={base}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlurBin}
        />
      )}
      {field.type === "TEXTAREA" && (
        <textarea className={base} rows={3} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />
      )}
      {field.type === "NUMBER" && (
        <input
          type="number"
          className={base}
          value={(value as number | string) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
      )}
      {field.type === "DATE" && (
        <input type="date" className={base} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />
      )}
      {field.type === "SELECT" && (
        <select className={base} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">Выберите…</option>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}
      {field.type === "RADIO" && (
        <div className="flex flex-wrap gap-3">
          {field.options.map((o) => (
            <label key={o} className="flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-sm">
              <input type="radio" checked={value === o} onChange={() => onChange(o)} />
              {o}
            </label>
          ))}
        </div>
      )}
      {field.type === "LOOKUP" && (
        <select className={base} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">Выберите…</option>
          {lookupItems.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
      {field.type === "CHECKBOX" && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={value === true || value === "true"} onChange={(e) => onChange(e.target.checked)} />
          {field.hint || "Да"}
        </label>
      )}
      {field.type === "FILE" && (
        <input
          type="file"
          className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-brand"
          onChange={(e) => onChange(e.target.files?.[0]?.name ?? "")}
        />
      )}
      {field.hint && field.type !== "CHECKBOX" && <p className="mt-1 text-xs text-slate-400">{field.hint}</p>}
    </div>
  );
}
