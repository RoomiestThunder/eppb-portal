"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { ProjectVM } from "@/components/ProjectMapClient";

const STATUS_LABELS: Record<string, string> = {
  planned: "Планируется",
  financing: "Финансируется",
  active: "Реализуется",
  completed: "Завершен",
};

function makeIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.15)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function formatAmount(n: number, currency: string) {
  return `${n.toLocaleString("ru-RU")} ${currency}`;
}

export default function ProjectMapInner({
  projects,
  organizations,
}: {
  projects: ProjectVM[];
  organizations: { id: string; shortName: string; logoColor: string }[];
}) {
  const [org, setOrg] = useState("");
  const [region, setRegion] = useState("");
  const [industry, setIndustry] = useState("");
  const [status, setStatus] = useState("");

  const regions = useMemo(() => Array.from(new Set(projects.map((p) => p.region))).sort(), [projects]);
  const industries = useMemo(() => Array.from(new Set(projects.map((p) => p.industry))).sort(), [projects]);

  const filtered = projects.filter((p) => {
    if (org && p.organization.id !== org) return false;
    if (region && p.region !== region) return false;
    if (industry && p.industry !== industry) return false;
    if (status && p.status !== status) return false;
    return true;
  });

  const byRegion = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of filtered) map.set(p.region, (map.get(p.region) ?? 0) + 1);
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered]);
  const maxRegionCount = Math.max(1, ...byRegion.map(([, c]) => c));

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        <select value={org} onChange={(e) => setOrg(e.target.value)} className="rounded-lg border border-black/10 px-3 py-1.5 text-sm">
          <option value="">Все организации</option>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.shortName}
            </option>
          ))}
        </select>
        <select value={region} onChange={(e) => setRegion(e.target.value)} className="rounded-lg border border-black/10 px-3 py-1.5 text-sm">
          <option value="">Все регионы</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="rounded-lg border border-black/10 px-3 py-1.5 text-sm">
          <option value="">Все отрасли</option>
          {industries.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-black/10 px-3 py-1.5 text-sm">
          <option value="">Все статусы</option>
          {Object.entries(STATUS_LABELS).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        <span className="ml-auto self-center text-sm text-slate-400">Найдено: {filtered.length}</span>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="h-[520px] overflow-hidden rounded-2xl border border-black/5 shadow-sm">
          <MapContainer center={[48.0196, 66.9237]} zoom={5} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filtered.map((p) => (
              <Marker key={p.id} position={[p.lat, p.lng]} icon={makeIcon(p.organization.logoColor)}>
                <Popup>
                  <div className="max-w-xs text-sm">
                    <p className="font-semibold">{p.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{p.organization.shortName}</p>
                    <dl className="mt-2 space-y-0.5 text-xs">
                      <div>Регион: {p.region}</div>
                      <div>Отрасль: {p.industry}</div>
                      <div>Сумма: {formatAmount(p.amount, p.currency)}</div>
                      <div>Период: {p.periodStart}–{p.periodEnd}</div>
                      <div>Статус: {STATUS_LABELS[p.status]}</div>
                    </dl>
                    <p className="mt-2 text-xs text-slate-500">{p.description}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div>
          <h2 className="font-semibold text-slate-900">Проекты по регионам</h2>
          <div className="mt-3 space-y-2">
            {byRegion.map(([r, count]) => (
              <div key={r}>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{r}</span>
                  <span>{count}</span>
                </div>
                <div className="mt-0.5 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-brand" style={{ width: `${(count / maxRegionCount) * 100}%` }} />
                </div>
              </div>
            ))}
            {byRegion.length === 0 && <p className="text-sm text-slate-400">Нет данных</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
