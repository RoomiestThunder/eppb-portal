import { prisma } from "@/lib/prisma";
import AnalyticsMaterialManager from "@/components/admin/AnalyticsMaterialManager";

export default async function AdminAnalyticsPage() {
  const [materials, organizations] = await Promise.all([
    prisma.analyticsMaterial.findMany({ include: { organization: true }, orderBy: { createdAt: "desc" } }),
    prisma.organization.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Модуль аналитической отчетности</h1>
      <p className="mt-1 text-slate-500">Каталог материалов дочерних организаций: описание, источник, период, ссылка/embedding.</p>
      <AnalyticsMaterialManager
        materials={JSON.parse(JSON.stringify(materials))}
        organizations={organizations.map((o) => ({ id: o.id, name: o.shortName }))}
      />
    </div>
  );
}
