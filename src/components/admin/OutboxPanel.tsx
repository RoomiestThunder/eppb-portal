"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OutboxPanel({
  pending,
  processed,
  failed,
  readOnly = false,
}: {
  pending: number;
  processed: number;
  failed: number;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function processNow() {
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/admin/outbox/process", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    setResult(`Обработано: ${data.processed}, ошибок: ${data.failed}`);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <h3 className="font-medium text-slate-900">Очередь передачи в BPM (outbox)</h3>
      <p className="mt-1 text-xs text-slate-500">
        Заявки не передаются в BPM синхронно — они становятся в очередь, чтобы недоступность BPM не блокировала приём заявок.
        В проде эта очередь — топик Kafka/RabbitMQ; воркер (<code>npm run worker</code>) обрабатывает её в фоне.
      </p>
      <div className="mt-3 flex gap-4 text-sm">
        <span className="text-amber-700">В очереди: {pending}</span>
        <span className="text-emerald-700">Обработано: {processed}</span>
        <span className="text-red-600">Ошибок: {failed}</span>
      </div>
      {!readOnly && (
        <button onClick={processNow} disabled={loading} className="mt-3 rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark disabled:opacity-50">
          {loading ? "Обработка…" : "Обработать очередь сейчас"}
        </button>
      )}
      {result && <p className="mt-2 text-xs text-slate-500">{result}</p>}
    </div>
  );
}
