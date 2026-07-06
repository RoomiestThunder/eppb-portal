"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
  name: string;
  organization: { shortName: string };
  region: string;
  industry: string;
  amount: number;
  status: string;
};

const EMPTY = {
  name: "",
  organizationId: "",
  region: "",
  locality: "",
  lat: 51.16,
  lng: 71.47,
  industry: "",
  amount: 0,
  currency: "KZT",
  status: "planned",
  periodStart: "2026",
  periodEnd: "2028",
  description: "",
};

export default function ProjectManager({ projects, organizations }: { projects: Project[]; organizations: { id: string; name: string }[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...EMPTY, organizationId: organizations[0]?.id ?? "" });
  const [open, setOpen] = useState(false);

  async function create() {
    if (!form.name.trim() || !form.organizationId) return;
    await fetch("/api/admin/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "createProject", payload: { ...form, lat: Number(form.lat), lng: Number(form.lng), amount: Number(form.amount) } }),
    });
    setForm({ ...EMPTY, organizationId: organizations[0]?.id ?? "" });
    setOpen(false);
    router.refresh();
  }

  async function remove(id: string) {
    await fetch("/api/admin/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteProject", payload: { id } }),
    });
    router.refresh();
  }

  return (
    <div className="mt-6">
      <button onClick={() => setOpen((v) => !v)} className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">
        {open ? "Скрыть форму" : "+ Добавить проект"}
      </button>

      {open && (
        <div className="mt-4 grid gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:grid-cols-2">
          <input placeholder="Название проекта" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm sm:col-span-2" />
          <select value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm">
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <input placeholder="Отрасль" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
          <input placeholder="Регион" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
          <input placeholder="Населенный пункт" value={form.locality} onChange={(e) => setForm({ ...form, locality: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
          <input type="number" step="0.0001" placeholder="Широта (lat)" value={form.lat} onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })} className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
          <input type="number" step="0.0001" placeholder="Долгота (lng)" value={form.lng} onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })} className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
          <input type="number" placeholder="Сумма финансирования" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm">
            {["planned", "financing", "active", "completed"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input placeholder="Период начала" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
          <input placeholder="Период окончания" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
          <textarea placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm sm:col-span-2" rows={2} />
          <button onClick={create} className="rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark sm:col-span-2">
            Сохранить проект
          </button>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {projects.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-xl border border-black/5 bg-white p-4 shadow-sm">
            <div>
              <p className="font-medium text-slate-800">{p.name}</p>
              <p className="text-xs text-slate-400">
                {p.organization.shortName} · {p.region} · {p.industry} · {p.status}
              </p>
            </div>
            <button onClick={() => remove(p.id)} className="text-xs text-red-400 hover:text-red-600">
              удалить
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
