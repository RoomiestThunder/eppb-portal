import { prisma } from "@/lib/prisma";
import { getSession, ORG_SCOPED_ROLES } from "@/lib/session";
import AnalyticsMaterialManager from "@/components/admin/AnalyticsMaterialManager";

export default async function AdminAnalyticsPage() {
  const session = await getSession();
  const scoped = session && ORG_SCOPED_ROLES.includes(session.role);

  const [materials, organizations] = await Promise.all([
    prisma.analyticsMaterial.findMany({
      where: scoped ? { organizationId: session!.organizationId! } : undefined,
      include: { organization: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.organization.findMany({
      where: scoped ? { id: session!.organizationId! } : undefined,
      orderBy: { name: "asc" },
    }),
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
