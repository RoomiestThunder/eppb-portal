"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPrompt() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function login() {
    setLoading(true);
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "CLIENT" }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={login}
      disabled={loading}
      className="mt-6 rounded-full bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
    >
      {loading ? "Вход…" : "Войти через eGov IDP (демо)"}
    </button>
  );
}
