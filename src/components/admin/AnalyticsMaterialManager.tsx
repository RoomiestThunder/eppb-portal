"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Material = {
  id: string;
  title: string;
  description: string;
  organizationId: string;
  organization: { shortName: string };
  materialType: string;
  source: string;
  period: string;
  linkUrl: string;
  embeddable: boolean;
};

const EMPTY = { title: "", description: "", organizationId: "", materialType: "report", source: "", period: "", linkUrl: "", embeddable: false };

export default function AnalyticsMaterialManager({
  materials,
  organizations,
}: {
  materials: Material[];
  organizations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({ ...EMPTY, organizationId: organizations[0]?.id ?? "" });
  const [open, setOpen] = useState(false);

  async function create() {
    if (!form.title.trim() || !form.organizationId) return;
    await fetch("/api/admin/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "createAnalyticsMaterial", payload: form }),
    });
    setForm({ ...EMPTY, organizationId: organizations[0]?.id ?? "" });
    setOpen(false);
    router.refresh();
  }

  async function remove(id: string) {
    await fetch("/api/admin/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteAnalyticsMaterial", payload: { id } }),
    });
    router.refresh();
  }

  return (
    <div className="mt-6">
      <button onClick={() => setOpen((v) => !v)} className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">
        {open ? "Скрыть форму" : "+ Добавить материал"}
      </button>

      {open && (
        <div className="mt-4 grid gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:grid-cols-2">
          <input placeholder="Заголовок" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
          <select value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm">
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <textarea placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm sm:col-span-2" rows={2} />
          <select value={form.materialType} onChange={(e) => setForm({ ...form, materialType: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm">
            {["portal", "report", "financial", "research", "dashboard"].map((t) => (
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
          <button onClick={create} className="rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark sm:col-span-2">
            Сохранить
          </button>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {materials.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-xl border border-black/5 bg-white p-4 shadow-sm">
            <div>
              <p className="font-medium text-slate-800">{m.title}</p>
              <p className="text-xs text-slate-400">
                {m.organization.shortName} · {m.materialType} · {m.period}
              </p>
            </div>
            <button onClick={() => remove(m.id)} className="text-xs text-red-400 hover:text-red-600">
              удалить
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
