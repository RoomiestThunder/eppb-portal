"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Item = { id: string; title: string; description: string; category: string; linkUrl: string };
const EMPTY = { title: "", description: "", category: "knowledge_base", linkUrl: "" };

export default function ResourceManager({ items }: { items: Item[] }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);

  async function create() {
    if (!form.title.trim()) return;
    await fetch("/api/admin/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "createResourceItem", payload: form }),
    });
    setForm(EMPTY);
    setOpen(false);
    router.refresh();
  }

  async function remove(id: string) {
    await fetch("/api/admin/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteResourceItem", payload: { id } }),
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
          <input placeholder="Заголовок" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm sm:col-span-2" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm">
            {["knowledge_base", "template", "checklist", "calculator", "guide"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input placeholder="Ссылка (/tools/calculator, # или https://…)" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
          <textarea placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm sm:col-span-2" rows={2} />
          <button onClick={create} className="rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark sm:col-span-2">
            Сохранить
          </button>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {items.map((i) => (
          <div key={i.id} className="flex items-center justify-between rounded-xl border border-black/5 bg-white p-4 shadow-sm">
            <div>
              <p className="font-medium text-slate-800">{i.title}</p>
              <p className="text-xs text-slate-400">{i.category}</p>
            </div>
            <button onClick={() => remove(i.id)} className="text-xs text-red-400 hover:text-red-600">
              удалить
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
