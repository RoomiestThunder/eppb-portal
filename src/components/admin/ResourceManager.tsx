"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Item = { id: string; title: string; titleKk: string | null; description: string; descriptionKk: string | null; category: string; linkUrl: string };

const CATEGORIES = ["knowledge_base", "template", "checklist", "calculator", "guide"];

const EMPTY = { title: "", titleKk: "", description: "", descriptionKk: "", category: "knowledge_base", linkUrl: "" };

function ItemFields({ form, setForm }: { form: typeof EMPTY; setForm: (f: typeof EMPTY) => void }) {
  return (
    <>
      <input placeholder="Заголовок" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
      <input placeholder="Заголовок (қазақша)" value={form.titleKk} onChange={(e) => setForm({ ...form, titleKk: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm italic" />
      <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm">
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input placeholder="Ссылка (/tools/calculator, # или https://…)" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
      <textarea placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm" rows={2} />
      <textarea placeholder="Описание (қазақша)" value={form.descriptionKk} onChange={(e) => setForm({ ...form, descriptionKk: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm italic" rows={2} />
    </>
  );
}

function EditRow({ item, onCancel, onSaved }: { item: Item; onCancel: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: item.title,
    titleKk: item.titleKk ?? "",
    description: item.description,
    descriptionKk: item.descriptionKk ?? "",
    category: item.category,
    linkUrl: item.linkUrl,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateResourceItem", payload: { id: item.id, data: { ...form, titleKk: form.titleKk || null, descriptionKk: form.descriptionKk || null } } }),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="mt-3 grid gap-3 rounded-xl border border-brand/20 bg-brand/5 p-4 sm:grid-cols-2">
      <ItemFields form={form} setForm={setForm} />
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

export default function ResourceManager({ items, readOnly = false }: { items: Item[]; readOnly?: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function create() {
    if (!form.title.trim()) return;
    await fetch("/api/admin/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "createResourceItem", payload: { ...form, titleKk: form.titleKk || null, descriptionKk: form.descriptionKk || null } }),
    });
    setForm(EMPTY);
    setOpen(false);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Удалить материал безвозвратно?")) return;
    await fetch("/api/admin/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteResourceItem", payload: { id } }),
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
          <ItemFields form={form} setForm={setForm} />
          <button onClick={create} className="rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark sm:col-span-2">
            Сохранить
          </button>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {items.map((i) => (
          <div key={i.id} className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">{i.title}</p>
                <p className="text-xs text-slate-400">{i.category}</p>
              </div>
              {!readOnly && (
                <div className="flex shrink-0 gap-3">
                  <button onClick={() => setEditingId(editingId === i.id ? null : i.id)} className="text-xs text-brand hover:underline">
                    {editingId === i.id ? "скрыть" : "редактировать"}
                  </button>
                  <button onClick={() => remove(i.id)} className="text-xs text-red-400 hover:text-red-600">
                    удалить
                  </button>
                </div>
              )}
            </div>
            {!readOnly && editingId === i.id && (
              <EditRow
                item={i}
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
