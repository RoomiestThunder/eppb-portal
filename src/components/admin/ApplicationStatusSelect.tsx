"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { STATUS_LABELS } from "@/lib/statusLabels";

export default function ApplicationStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function change(newStatus: string) {
    setLoading(true);
    await fetch(`/api/admin/applications/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <select
      defaultValue={status}
      disabled={loading}
      onChange={(e) => change(e.target.value)}
      className="rounded-lg border border-black/10 px-2 py-1 text-xs"
    >
      {Object.entries(STATUS_LABELS).map(([k, l]) => (
        <option key={k} value={k}>
          {l}
        </option>
      ))}
    </select>
  );
}
