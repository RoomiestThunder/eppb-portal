import { prisma } from "@/lib/prisma";
import AnalyticsCard from "@/components/AnalyticsCard";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ org?: string }> }) {
  const { org } = await searchParams;
  const locale = await getLocale();
  const [materials, organizations] = await Promise.all([
    prisma.analyticsMaterial.findMany({ include: { organization: true }, orderBy: { createdAt: "desc" } }),
    prisma.organization.findMany({ orderBy: { name: "asc" } }),
  ]);

  const TYPE_LABEL_KEY: Record<string, "typePortal" | "typeReport" | "typeFinancial" | "typeResearch" | "typeDashboard"> = {
    portal: "typePortal",
    report: "typeReport",
    financial: "typeFinancial",
    research: "typeResearch",
    dashboard: "typeDashboard",
  };

  const filtered = org ? materials.filter((m) => m.organizationId === org) : materials;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">{t(locale, "analyticsTitle")}</h1>
      <p className="mt-1 text-slate-500">{t(locale, "analyticsSubtitle")}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <a href="/analytics" className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${!org ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`}>
          {t(locale, "allOrganizations")}
        </a>
        {organizations.map((o) => (
          <a
            key={o.id}
            href={`/analytics?org=${o.id}`}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${org === o.id ? "bg-brand text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {o.shortName}
          </a>
        ))}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m) => (
          <AnalyticsCard
            key={m.id}
            locale={locale}
            material={{
              id: m.id,
              title: m.title,
              description: m.description,
              orgName: m.organization.shortName,
              orgColor: m.organization.logoColor,
              typeLabel: t(locale, TYPE_LABEL_KEY[m.materialType] ?? "typePortal"),
              source: m.source,
              period: m.period,
              linkUrl: m.linkUrl,
              embeddable: m.embeddable,
            }}
          />
        ))}
      </div>
    </div>
  );
}
