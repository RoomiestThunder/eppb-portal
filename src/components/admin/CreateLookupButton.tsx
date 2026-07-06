"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateLookupButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  async function create() {
    if (!code.trim() || !name.trim()) return;
    await fetch("/api/admin/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "createLookup", payload: { code: code.trim(), name: name.trim() } }),
    });
    setOpen(false);
    setCode("");
    setName("");
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">
        + Новый справочник
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="font-semibold text-slate-900">Новый справочник</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название" className="mt-3 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="code (например industries)" className="mt-2 w-full rounded-lg border border-black/10 px-3 py-2 font-mono text-sm" />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setOpen(false)} className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-600">
            Отмена
          </button>
          <button onClick={create} className="rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark">
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}
