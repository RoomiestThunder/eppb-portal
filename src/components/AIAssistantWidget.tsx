"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { Recommendation } from "@/lib/ai";

type Message = { role: "user" | "assistant"; text: string; recommendations?: Recommendation[] };

export default function AIAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Здравствуйте! Я AI-помощник ЕППБ. Опишите, какая поддержка вам нужна — например, «хочу купить вагоны в лизинг» или «субсидия на животноводство» — и я подберу подходящую услугу.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", text: data.reply, recommendations: data.recommendations }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Произошла ошибка. Попробуйте ещё раз." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl sm:w-96">
          <div className="flex items-center justify-between bg-brand px-4 py-3 text-white">
            <span className="font-medium">AI-помощник ЕППБ</span>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              ✕
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm " +
                    (m.role === "user" ? "bg-brand text-white" : "bg-slate-100 text-slate-800")
                  }
                >
                  {m.text}
                  {m.recommendations && m.recommendations.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {m.recommendations.map((r) => (
                        <Link
                          key={r.service.id}
                          href={`/services/${r.service.slug}`}
                          className="block rounded-lg border border-brand/20 bg-white px-2 py-1.5 text-brand hover:bg-brand/5"
                        >
                          → {r.service.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-slate-400">печатает…</div>}
            <div ref={endRef} />
          </div>
          <div className="flex items-center gap-2 border-t border-black/10 p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Опишите вашу задачу…"
              className="flex-1 rounded-full border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <button onClick={send} className="rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark">
              →
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-brand-dark shadow-xl transition hover:scale-105"
        aria-label="AI-помощник"
      >
        <span className="text-2xl">✨</span>
      </button>
    </div>
  );
}
