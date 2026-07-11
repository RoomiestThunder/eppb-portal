"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateServiceButton({ organizations }: { organizations: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id ?? "");
  const [shortDescription, setShortDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function create() {
    if (!name.trim() || !category.trim() || !organizationId) return;
    setLoading(true);
    const res = await fetch("/api/admin/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "createService", payload: { name, category, organizationId, shortDescription } }),
    });
    const data = await res.json();
    setLoading(false);
    setOpen(false);
    router.push(`/admin/builder/${data.id}`);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">
        + Новая услуга
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="font-semibold text-slate-900">Новая услуга</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Название услуги</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Категория</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2" placeholder="Кредитование, Лизинг…" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Организация</label>
            <select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2">
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Краткое описание</label>
            <textarea value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2" rows={2} />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setOpen(false)} className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-600">
            Отмена
          </button>
          <button onClick={create} disabled={loading} className="rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark disabled:opacity-50">
            {loading ? "Создание…" : "Создать и открыть конструктор"}
          </button>
        </div>
      </div>
    </div>
  );
}
