"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleAlert, TriangleAlert, Sparkles } from "lucide-react";
import { computeVisibleFieldsWithCalculations, type FieldLike } from "@/lib/ruleEngine";
import { checkApplicationCompleteness } from "@/lib/ai";
import { t, type Locale } from "@/lib/i18n";

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
  draftId,
  locale,
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
  draftId?: string; // resuming an autosaved draft for a first-stage (not yet submitted) application
  locale: Locale;
}) {
  const router = useRouter();
  const allFields = useMemo(() => steps.flatMap((s) => s.fields), [steps]);

  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const initial = { ...(initialData ?? {}) };
    if (profile.bin) {
      const binKeys = steps.flatMap((s) => s.fields).filter((f) => f.prefillSource === "egov.bin").map((f) => f.key);
      for (const key of binKeys) if (!initial[key]) initial[key] = profile.bin;
    }
    return initial;
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [aiIssues, setAiIssues] = useState<string[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ number: string } | null>(null);
  const binLookupFired = useRef(false);
  // One key per wizard mount — a duplicate submit (double-click, retry after a dropped response)
  // reuses the same key so the server returns the existing application instead of creating another.
  const idempotencyKey = useRef(crypto.randomUUID());

  // Draft autosave (only for a first-time submission flow, not the "continue to next stage" one —
  // that flow already has a real, submitted Application behind it).
  const [currentDraftId, setCurrentDraftId] = useState(draftId);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextAutosave = useRef(true); // don't autosave the very first render (nothing changed yet)

  const { visible, enrichedData } = useMemo(() => computeVisibleFieldsWithCalculations(allFields, formData), [allFields, formData]);
  const visibleIds = useMemo(() => new Set(visible.map((f) => f.id)), [visible]);

  useEffect(() => {
    if (applicationId) return; // continuing a later stage of an already-submitted application — no drafts here
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/applications/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceId, data: formData, draftId: currentDraftId }),
        });
        const data = await res.json();
        if (data.draftId) setCurrentDraftId(data.draftId);
        if (!data.alreadySubmitted) setDraftSavedAt(new Date());
      } catch {
        // best-effort — losing one autosave tick isn't fatal, the next edit will retry
      }
    }, 2000);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

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

  // Company name lookup based on the BIN already seeded into formData above — fires once.
  useEffect(() => {
    if (binLookupFired.current) return;
    if (binFieldKeys.length > 0 && profile.bin) {
      binLookupFired.current = true;
      // setState happens inside runBinLookup only after the fetch resolves, not synchronously here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      runBinLookup(profile.bin);
    }
  }, [binFieldKeys, profile.bin, runBinLookup]);

  function setValue(key: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function validateStep(): string[] {
    const issues: string[] = [];
    for (const f of stepFields) {
      if (!f.required || f.type === "INFO" || f.type === "CALCULATED") continue;
      const v = enrichedData[f.key];
      const empty = v === undefined || v === null || v === "";
      if (empty) issues.push(`«${f.label}» — ${t(locale, "wizardFieldRequired")}`);
      else if (f.type === "NUMBER") {
        const n = Number(v);
        if (Number.isNaN(n)) issues.push(`«${f.label}» — ${t(locale, "wizardFieldMustBeNumber")}`);
        else {
          if (f.validation?.min !== undefined && n < f.validation.min) issues.push(`«${f.label}» — ${t(locale, "wizardFieldMin")} ${f.validation.min}`);
          if (f.validation?.max !== undefined && n > f.validation.max) issues.push(`«${f.label}» — ${t(locale, "wizardFieldMax")} ${f.validation.max}`);
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
        body: JSON.stringify({
          serviceId,
          data: enrichedData,
          applicationId,
          targetStageOrder,
          idempotencyKey: idempotencyKey.current,
          draftId: currentDraftId,
        }),
      });
      if (!res.ok) throw new Error("submit failed");
      const data = await res.json();
      setResult({ number: data.number });
    } catch {
      setErrors([t(locale, "wizardSubmitError")]);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <CircleCheck className="h-7 w-7 text-emerald-600" strokeWidth={2} />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-slate-900">{t(locale, "wizardResultTitle")}</h2>
        <p className="mt-2 text-slate-600">
          {t(locale, "wizardResultNumber")} <span className="font-mono font-semibold">{result.number}</span>
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {applicationId ? t(locale, "wizardResultBodyContinued") : t(locale, "wizardResultBodySubmitted")}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => router.push("/cabinet")} className="rounded-full bg-brand px-5 py-2.5 text-white hover:bg-brand-dark">
            {t(locale, "wizardGoToCabinet")}
          </button>
          <button onClick={() => router.push(`/services/${serviceSlug}`)} className="rounded-full border border-slate-300 px-5 py-2.5 text-slate-600 hover:bg-white">
            {t(locale, "wizardGoToService")}
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
          <div key={s.id} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= stepIndex ? "bg-brand" : "bg-slate-200"}`} />
        ))}
      </div>
      <p className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span>
          {t(locale, "wizardStepOf")} {stepIndex + 1} {t(locale, "wizardStepOfSeparator")} {steps.length}
        </span>
        {!applicationId && draftSavedAt && (
          <span className="text-emerald-600">
            {t(locale, "wizardDraftSaved")} {draftSavedAt.toLocaleTimeString("ru-RU")}
          </span>
        )}
      </p>

      <div className="mt-4 rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        <div key={step.id} className="wizard-step-enter">
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
                locale={locale}
              />
            ))}
          </div>

          {errors.length > 0 && (
            <div role="alert" aria-live="polite" className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
              <div>
                <p className="font-medium">{t(locale, "wizardCheckFields")}</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  {errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {stepIndex === steps.length - 1 && (
            <div className="mt-5">
              <button
                onClick={runAiCheck}
                className="flex items-center gap-1.5 rounded-full border border-brand/30 px-4 py-2 text-sm text-brand hover:bg-brand/5"
              >
                <Sparkles className="h-4 w-4" strokeWidth={2} />
                {t(locale, "wizardAiCheck")}
              </button>
              {aiIssues && (
                <div
                  role="status"
                  className={`mt-3 flex gap-3 rounded-xl p-4 text-sm ${aiIssues.length === 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                >
                  {aiIssues.length === 0 ? (
                    <>
                      <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                      <p>{t(locale, "wizardAiCheckOk")}</p>
                    </>
                  ) : (
                    <>
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                      <ul className="list-inside list-disc space-y-0.5">
                        {aiIssues.map((i) => (
                          <li key={i}>{i}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={goBack}
            disabled={stepIndex === 0}
            className="rounded-full border border-slate-300 px-5 py-2.5 text-slate-600 disabled:opacity-30"
          >
            {t(locale, "wizardBack")}
          </button>
          {stepIndex < steps.length - 1 ? (
            <button onClick={goNext} className="rounded-full bg-brand px-6 py-2.5 text-white hover:bg-brand-dark">
              {t(locale, "wizardNext")}
            </button>
          ) : (
            <button onClick={submit} disabled={submitting} className="rounded-full bg-brand px-6 py-2.5 text-white hover:bg-brand-dark disabled:opacity-50">
              {submitting ? t(locale, "wizardSubmitting") : t(locale, "wizardSubmit")}
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
  locale,
}: {
  field: WizardField;
  value: unknown;
  onChange: (v: unknown) => void;
  onBlurBin?: () => void;
  lookupItems: { value: string; label: string }[];
  locale: Locale;
}) {
  const base = "w-full rounded-xl border border-black/10 px-3.5 py-2.5 outline-none focus:border-brand";

  if (field.type === "INFO") {
    return (
      <div className="flex gap-3 rounded-xl bg-brand/5 p-4 text-sm text-brand-dark">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2} />
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
          <option value="">{t(locale, "wizardSelectPlaceholder")}</option>
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
          <option value="">{t(locale, "wizardSelectPlaceholder")}</option>
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
          {field.hint || t(locale, "wizardYes")}
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
