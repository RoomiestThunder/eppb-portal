import { prisma } from "@/lib/prisma";
import ProjectMapClient from "@/components/ProjectMapClient";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export default async function MapPage() {
  const locale = await getLocale();
  const [projects, organizations] = await Promise.all([
    prisma.project.findMany({ include: { organization: true }, orderBy: { name: "asc" } }),
    prisma.organization.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">{t(locale, "mapTitle")}</h1>
      <p className="mt-1 text-slate-500">{t(locale, "mapSubtitle")}</p>
      <ProjectMapClient
        locale={locale}
        projects={JSON.parse(JSON.stringify(projects))}
        organizations={organizations.map((o) => ({ id: o.id, shortName: o.shortName, logoColor: o.logoColor }))}
      />
    </div>
  );
}
