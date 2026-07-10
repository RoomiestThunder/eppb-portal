"use client";

import dynamic from "next/dynamic";
import type { Locale } from "@/lib/i18n";

const ProjectMapInner = dynamic(() => import("@/components/ProjectMapInner"), {
  ssr: false,
  loading: () => <div className="mt-6 h-[520px] animate-pulse rounded-2xl border border-black/5 bg-slate-50" />,
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
  locale,
}: {
  projects: ProjectVM[];
  organizations: { id: string; shortName: string; logoColor: string }[];
  locale: Locale;
}) {
  return <ProjectMapInner projects={projects} organizations={organizations} locale={locale} />;
}
