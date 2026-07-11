"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Material = {
  id: string;
  title: string;
  titleKk: string | null;
  description: string;
  descriptionKk: string | null;
  organizationId: string;
  organization: { shortName: string };
  materialType: string;
  source: string;
  period: string;
  linkUrl: string;
  embeddable: boolean;
};

const MATERIAL_TYPES = ["portal", "report", "financial", "research", "dashboard"];

const EMPTY = {
  title: "",
  titleKk: "",
  description: "",
  descriptionKk: "",
  organizationId: "",
  materialType: "report",
  source: "",
  period: "",
  linkUrl: "",
  embeddable: false,
};

function MaterialFields({
  form,
  setForm,
  organizations,
}: {
  form: typeof EMPTY;
  setForm: (f: typeof EMPTY) => void;
  organizations: { id: string; name: string }[];
}) {
  return (
    <>
      <input placeholder="Заголовок" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
      <input placeholder="Заголовок (қазақша)" value={form.titleKk} onChange={(e) => setForm({ ...form, titleKk: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm italic" />
      <select value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm sm:col-span-2">
        {organizations.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <textarea placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm" rows={2} />
      <textarea placeholder="Описание (қазақша)" value={form.descriptionKk} onChange={(e) => setForm({ ...form, descriptionKk: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm italic" rows={2} />
      <select value={form.materialType} onChange={(e) => setForm({ ...form, materialType: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm">
        {MATERIAL_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <input placeholder="Источник" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
      <input placeholder="Период" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
      <input placeholder="Ссылка" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={form.embeddable} onChange={(e) => setForm({ ...form, embeddable: e.target.checked })} />
        Доступен embedding
      </label>
    </>
  );
}

function EditRow({ material, organizations, onCancel, onSaved }: { material: Material; organizations: { id: string; name: string }[]; onCancel: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: material.title,
    titleKk: material.titleKk ?? "",
    description: material.description,
    descriptionKk: material.descriptionKk ?? "",
    organizationId: material.organizationId,
    materialType: material.materialType,
    source: material.source,
    period: material.period,
    linkUrl: material.linkUrl,
    embeddable: material.embeddable,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateAnalyticsMaterial",
        payload: { id: material.id, data: { ...form, titleKk: form.titleKk || null, descriptionKk: form.descriptionKk || null } },
      }),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="mt-3 grid gap-3 rounded-xl border border-brand/20 bg-brand/5 p-4 sm:grid-cols-2">
      <MaterialFields form={form} setForm={setForm} organizations={organizations} />
      <div className="flex gap-2 sm:col-span-2">
        <button onClick={save} disabled={saving} className="rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark disabled:opacity-50">
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
        <button onClick={onCancel} className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-white">
          Отмена
        </button>
      </div>
    </div>
  );
}

export default function AnalyticsMaterialManager({
  materials,
  organizations,
  readOnly = false,
}: {
  materials: Material[];
  organizations: { id: string; name: string }[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ ...EMPTY, organizationId: organizations[0]?.id ?? "" });
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function create() {
    if (!form.title.trim() || !form.organizationId) return;
    await fetch("/api/admin/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "createAnalyticsMaterial", payload: { ...form, titleKk: form.titleKk || null, descriptionKk: form.descriptionKk || null } }),
    });
    setForm({ ...EMPTY, organizationId: organizations[0]?.id ?? "" });
    setOpen(false);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Удалить материал безвозвратно?")) return;
    await fetch("/api/admin/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteAnalyticsMaterial", payload: { id } }),
    });
    router.refresh();
  }

  return (
    <div className="mt-6">
      {readOnly && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Режим «только чтение» — изменения недоступны для роли «Аналитик».
        </p>
      )}

      {!readOnly && (
        <button onClick={() => setOpen((v) => !v)} className="mt-3 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">
          {open ? "Скрыть форму" : "+ Добавить материал"}
        </button>
      )}

      {!readOnly && open && (
        <div className="mt-4 grid gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:grid-cols-2">
          <MaterialFields form={form} setForm={setForm} organizations={organizations} />
          <button onClick={create} className="rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark sm:col-span-2">
            Сохранить
          </button>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {materials.map((m) => (
          <div key={m.id} className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">{m.title}</p>
                <p className="text-xs text-slate-400">
                  {m.organization.shortName} · {m.materialType} · {m.period}
                </p>
              </div>
              {!readOnly && (
                <div className="flex shrink-0 gap-3">
                  <button onClick={() => setEditingId(editingId === m.id ? null : m.id)} className="text-xs text-brand hover:underline">
                    {editingId === m.id ? "скрыть" : "редактировать"}
                  </button>
                  <button onClick={() => remove(m.id)} className="text-xs text-red-400 hover:text-red-600">
                    удалить
                  </button>
                </div>
              )}
            </div>
            {!readOnly && editingId === m.id && (
              <EditRow
                material={m}
                organizations={organizations}
                onCancel={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  router.refresh();
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
