"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Item = { id: string; value: string; label: string };

async function mutate(action: string, payload: unknown) {
  const res = await fetch("/api/admin/mutate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  return res.json();
}

export default function LookupManager({ lookup }: { lookup: { id: string; code: string; name: string; items: Item[] } }) {
  const router = useRouter();
  const [newValue, setNewValue] = useState("");
  const [newLabel, setNewLabel] = useState("");

  async function addItem() {
    if (!newValue.trim() || !newLabel.trim()) return;
    await mutate("createLookupItem", { lookupId: lookup.id, value: newValue.trim(), label: newLabel.trim() });
    setNewValue("");
    setNewLabel("");
    router.refresh();
  }

  async function deleteItem(id: string) {
    await mutate("deleteLookupItem", { id });
    router.refresh();
  }

  async function deleteLookup() {
    if (!confirm(`Удалить справочник «${lookup.name}»?`)) return;
    await mutate("deleteLookup", { id: lookup.id });
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">{lookup.name}</h3>
          <p className="font-mono text-xs text-slate-400">{lookup.code}</p>
        </div>
        <button onClick={deleteLookup} className="text-xs text-red-400 hover:text-red-600">
          удалить справочник
        </button>
      </div>

      <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto">
        {lookup.items.map((it) => (
          <li key={it.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
            <span>
              {it.label} <span className="text-xs text-slate-400">({it.value})</span>
            </span>
            <button onClick={() => deleteItem(it.id)} className="text-xs text-red-400 hover:text-red-600">
              ✕
            </button>
          </li>
        ))}
        {lookup.items.length === 0 && <p className="text-sm text-slate-400">Нет элементов</p>}
      </ul>

      <div className="mt-3 flex gap-2">
        <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="value" className="w-24 rounded-lg border border-black/10 px-2 py-1.5 text-xs" />
        <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Отображаемое название" className="flex-1 rounded-lg border border-black/10 px-2 py-1.5 text-xs" />
        <button onClick={addItem} className="rounded-lg bg-brand px-3 py-1.5 text-xs text-white hover:bg-brand-dark">
          + Добавить
        </button>
      </div>
    </div>
  );
}
