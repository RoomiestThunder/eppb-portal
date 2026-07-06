"use client";

import dynamic from "next/dynamic";

const ProjectMapInner = dynamic(() => import("@/components/ProjectMapInner"), {
  ssr: false,
  loading: () => (
    <div className="mt-6 flex h-[520px] items-center justify-center rounded-2xl border border-black/5 bg-white text-slate-400">
      Загрузка карты…
    </div>
  ),
});

export type ProjectVM = {
  id: string;
  name: string;
  region: string;
  locality: string;
  lat: number;
  lng: number;
  industry: string;
  amount: number;
  currency: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  description: string;
  organization: { id: string; shortName: string; logoColor: string };
};

export default function ProjectMapClient({
  projects,
  organizations,
}: {
  projects: ProjectVM[];
  organizations: { id: string; shortName: string; logoColor: string }[];
}) {
  return <ProjectMapInner projects={projects} organizations={organizations} />;
}
