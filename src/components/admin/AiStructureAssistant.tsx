"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

type DraftField = { key: string; label: string; type: string; required: boolean; hint?: string };
type DraftStep = { title: string; fields: DraftField[] };

async function mutate(action: string, payload: unknown) {
  const res = await fetch("/api/admin/mutate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  return res.json();
}

export default function AiStructureAssistant({
  serviceId,
  stages,
  onApplied,
}: {
  serviceId: string;
  stages: unknown[];
  onApplied: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [draft, setDraft] = useState<{ category: string; steps: DraftStep[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  async function generate() {
    if (!description.trim()) return;
    setLoading(true);
    const res = await fetch("/api/ai/suggest-structure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    const data = await res.json();
    setDraft(data.draft);
    setLoading(false);
  }

  async function apply() {
    if (!draft) return;
    setApplying(true);
    const stage = await mutate("createStage", { serviceId, title: `Этап ${stages.length + 1} (AI-черновик)` });
    for (const step of draft.steps) {
      const createdStep = await mutate("createStep", { stageId: stage.id, title: step.title });
      for (const field of step.fields) {
        const createdField = await mutate("createField", { stepId: createdStep.id, key: field.key, label: field.label, type: field.type });
        if (field.required || field.hint) {
          await mutate("updateField", { id: createdField.id, data: { required: !!field.required, hint: field.hint ?? "" } });
        }
      }
    }
    setApplying(false);
    setDraft(null);
    setOpen(false);
    setDescription("");
    onApplied();
  }

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-brand/30 bg-brand/5 p-5">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
        <span className="flex items-center gap-1.5 font-medium text-brand">
          <Sparkles className="h-4 w-4 shrink-0" strokeWidth={2} />
          AI-помощник автора: сгенерировать черновик структуры услуги
        </span>
        <span className="shrink-0 text-brand">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="mt-3">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Опишите услугу свободным текстом, например: «лизинг сельхозтехники для фермеров»"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
          />
          <button
            onClick={generate}
            disabled={loading}
            className="mt-2 rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "Генерация…" : "Сгенерировать черновик"}
          </button>

          {draft && (
            <div className="mt-4 rounded-xl bg-white p-4">
              <p className="text-sm text-slate-500">
                Определена категория: <span className="font-medium text-slate-800">{draft.category}</span>
              </p>
              <div className="mt-2 space-y-2">
                {draft.steps.map((s, i) => (
                  <div key={i} className="rounded-lg bg-slate-50 p-3 text-sm">
                    <p className="font-medium text-slate-800">{s.title}</p>
                    <ul className="mt-1 list-inside list-disc text-xs text-slate-500">
                      {s.fields.map((f) => (
                        <li key={f.key}>
                          {f.label} — {f.type}
                          {f.required ? ", обязательное" : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">Черновик будет добавлен как новый этап. Поля можно будет донастроить вручную.</p>
              <button
                onClick={apply}
                disabled={applying}
                className="mt-3 rounded-full bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {applying ? "Применение…" : "Применить как новый этап"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
