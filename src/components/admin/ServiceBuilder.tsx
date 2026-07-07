"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FieldEditorRow from "@/components/admin/FieldEditorRow";
import AiStructureAssistant from "@/components/admin/AiStructureAssistant";

type FieldT = {
  id: string;
  order: number;
  key: string;
  label: string;
  labelKk: string | null;
  hint: string;
  hintKk: string | null;
  type: string;
  required: boolean;
  options: string;
  lookupCode: string | null;
  formula: string | null;
  visibilityRule: string | null;
  validation: string | null;
};
type StepT = { id: string; order: number; title: string; description: string; fields: FieldT[] };
type StageT = { id: string; order: number; title: string; description: string; steps: StepT[] };
type ServiceT = {
  id: string;
  slug: string;
  name: string;
  nameKk: string | null;
  category: string;
  shortDescription: string;
  shortDescriptionKk: string | null;
  fullDescription: string;
  fullDescriptionKk: string | null;
  status: string;
  organizationId: string;
  organization: { id: string; name: string };
  stages: StageT[];
};

const FIELD_TYPES = ["TEXT", "TEXTAREA", "NUMBER", "DATE", "SELECT", "RADIO", "CHECKBOX", "LOOKUP", "FILE", "CALCULATED", "INFO"];

async function mutate(action: string, payload: unknown) {
  const res = await fetch("/api/admin/mutate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  return res.json();
}

export default function ServiceBuilder({
  service,
  organizations,
  lookupCodes,
}: {
  service: ServiceT;
  organizations: { id: string; name: string }[];
  lookupCodes: { code: string; name: string }[];
}) {
  const router = useRouter();
  const [activeStageId, setActiveStageId] = useState(service.stages[0]?.id);
  const [activeStepId, setActiveStepId] = useState(service.stages[0]?.steps[0]?.id);
  const [busy, setBusy] = useState(false);

  const allFieldsFlat = service.stages.flatMap((st) => st.steps.flatMap((s) => s.fields));

  const activeStage = service.stages.find((s) => s.id === activeStageId) ?? service.stages[0];
  const activeStep = activeStage?.steps.find((s) => s.id === activeStepId) ?? activeStage?.steps[0];

  function refresh() {
    router.refresh();
  }

  async function updateServiceMeta(data: Record<string, unknown>) {
    await mutate("updateService", { id: service.id, data });
    refresh();
  }

  async function togglePublish() {
    await mutate("publishService", { id: service.id, status: service.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" });
    refresh();
  }

  async function deleteService() {
    if (!confirm(`Удалить услугу «${service.name}» безвозвратно?`)) return;
    await mutate("deleteService", { id: service.id });
    router.push("/admin/constructor");
  }

  async function addStage() {
    setBusy(true);
    const r = await mutate("createStage", { serviceId: service.id, title: `Этап ${service.stages.length + 1}` });
    setBusy(false);
    setActiveStageId(r.id);
    refresh();
  }

  async function deleteStage(id: string) {
    if (!confirm("Удалить этап и все его шаги/поля?")) return;
    await mutate("deleteStage", { id });
    refresh();
  }

  async function addStep(stageId: string) {
    const r = await mutate("createStep", { stageId, title: `Шаг` });
    setActiveStepId(r.id);
    refresh();
  }

  async function deleteStep(id: string) {
    if (!confirm("Удалить шаг и все его поля?")) return;
    await mutate("deleteStep", { id });
    refresh();
  }

  async function addField(stepId: string) {
    const idx = (activeStep?.fields.length ?? 0) + 1;
    await mutate("createField", { stepId, key: `field_${idx}`, label: "Новое поле", type: "TEXT" });
    refresh();
  }

  return (
    <div>
      <button onClick={() => router.push("/admin/constructor")} className="text-sm text-slate-400 hover:text-brand">
        ← Все услуги
      </button>

      {/* Service meta */}
      <div className="mt-3 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <input
              defaultValue={service.name}
              onBlur={(e) => e.target.value !== service.name && updateServiceMeta({ name: e.target.value })}
              className="w-full rounded-lg border border-transparent px-2 py-1 text-xl font-bold text-slate-900 hover:border-black/10 focus:border-brand"
            />
            <input
              defaultValue={service.nameKk ?? ""}
              onBlur={(e) => e.target.value !== (service.nameKk ?? "") && updateServiceMeta({ nameKk: e.target.value || null })}
              placeholder="Атауы (қазақша, көрсетілмесе — орысша нұсқасы қолданылады)"
              className="w-full rounded-lg border border-transparent px-2 py-1 text-sm italic text-slate-500 hover:border-black/10 focus:border-brand"
            />
            <div className="flex flex-wrap gap-3">
              <input
                defaultValue={service.category}
                onBlur={(e) => e.target.value !== service.category && updateServiceMeta({ category: e.target.value })}
                className="rounded-lg border border-black/10 px-2 py-1 text-sm"
                placeholder="Категория"
              />
              <select
                defaultValue={service.organizationId}
                onChange={(e) => updateServiceMeta({ organizationId: e.target.value })}
                className="rounded-lg border border-black/10 px-2 py-1 text-sm"
              >
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              defaultValue={service.shortDescription}
              onBlur={(e) => e.target.value !== service.shortDescription && updateServiceMeta({ shortDescription: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-black/10 px-2 py-1 text-sm text-slate-600"
              placeholder="Краткое описание для карточки услуги"
            />
            <textarea
              defaultValue={service.shortDescriptionKk ?? ""}
              onBlur={(e) =>
                e.target.value !== (service.shortDescriptionKk ?? "") && updateServiceMeta({ shortDescriptionKk: e.target.value || null })
              }
              rows={2}
              className="w-full rounded-lg border border-black/10 px-2 py-1 text-sm italic text-slate-500"
              placeholder="Қысқаша сипаттама (қазақша)"
            />
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <span
              className={`rounded-full px-3 py-1 text-center text-xs font-medium ${
                service.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {service.status === "PUBLISHED" ? "Опубликовано" : "Черновик"}
            </span>
            <button onClick={togglePublish} className="rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark">
              {service.status === "PUBLISHED" ? "Снять с публикации" : "Опубликовать"}
            </button>
            <button onClick={deleteService} className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              Удалить услугу
            </button>
          </div>
        </div>
      </div>

      <AiStructureAssistant
        serviceId={service.id}
        stages={service.stages}
        onApplied={refresh}
      />

      {/* Stages tabs */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {service.stages.map((st) => (
          <button
            key={st.id}
            onClick={() => {
              setActiveStageId(st.id);
              setActiveStepId(st.steps[0]?.id);
            }}
            className={`rounded-full px-4 py-2 text-sm ${st.id === activeStage?.id ? "bg-brand text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            Этап {st.order}. {st.title}
          </button>
        ))}
        <button onClick={addStage} disabled={busy} className="rounded-full border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-500 hover:border-brand hover:text-brand">
          + Этап
        </button>
      </div>

      {activeStage && (
        <div className="mt-4 grid gap-6 lg:grid-cols-[220px_1fr]">
          {/* Steps sidebar */}
          <div>
            <div className="flex items-center justify-between">
              <input
                defaultValue={activeStage.title}
                onBlur={(e) => e.target.value !== activeStage.title && mutate("updateStage", { id: activeStage.id, data: { title: e.target.value } }).then(refresh)}
                className="w-full rounded-lg border border-transparent px-1 text-sm font-medium hover:border-black/10 focus:border-brand"
              />
              <button onClick={() => deleteStage(activeStage.id)} className="text-xs text-red-400 hover:text-red-600">
                удалить
              </button>
            </div>
            <div className="mt-2 space-y-1">
              {activeStage.steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStepId(step.id)}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${step.id === activeStep?.id ? "bg-brand/10 text-brand" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  {step.order}. {step.title} <span className="text-xs text-slate-400">({step.fields.length})</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => addStep(activeStage.id)}
              className="mt-2 w-full rounded-lg border border-dashed border-slate-300 py-2 text-xs text-slate-500 hover:border-brand hover:text-brand"
            >
              + Шаг
            </button>
          </div>

          {/* Fields editor */}
          {activeStep && (
            <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <input
                  defaultValue={activeStep.title}
                  onBlur={(e) => e.target.value !== activeStep.title && mutate("updateStep", { id: activeStep.id, data: { title: e.target.value } }).then(refresh)}
                  className="flex-1 rounded-lg border border-transparent px-2 py-1 font-semibold hover:border-black/10 focus:border-brand"
                />
                <button onClick={() => deleteStep(activeStep.id)} className="text-xs text-red-400 hover:text-red-600 whitespace-nowrap">
                  удалить шаг
                </button>
              </div>
              <textarea
                defaultValue={activeStep.description}
                onBlur={(e) => e.target.value !== activeStep.description && mutate("updateStep", { id: activeStep.id, data: { description: e.target.value } }).then(refresh)}
                placeholder="Описание шага (необязательно)"
                rows={1}
                className="mt-1 w-full rounded-lg border border-transparent px-2 py-1 text-sm text-slate-500 hover:border-black/10 focus:border-brand"
              />

              <div className="mt-4 space-y-3">
                {activeStep.fields.map((f) => (
                  <FieldEditorRow
                    key={f.id}
                    field={f}
                    availableFields={allFieldsFlat.filter((af) => af.id !== f.id)}
                    lookupCodes={lookupCodes}
                    fieldTypes={FIELD_TYPES}
                    onSave={(data) => mutate("updateField", { id: f.id, data }).then(refresh)}
                    onDelete={() => mutate("deleteField", { id: f.id }).then(refresh)}
                  />
                ))}
              </div>

              <button
                onClick={() => addField(activeStep.id)}
                className="mt-4 w-full rounded-xl border border-dashed border-slate-300 py-2.5 text-sm text-slate-500 hover:border-brand hover:text-brand"
              >
                + Добавить поле
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
