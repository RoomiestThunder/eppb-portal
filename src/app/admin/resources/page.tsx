import { prisma } from "@/lib/prisma";
import ResourceManager from "@/components/admin/ResourceManager";

export default async function AdminResourcesPage() {
  const items = await prisma.resourceItem.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Инструменты и материалы</h1>
      <p className="mt-1 text-slate-500">Управление базой знаний, шаблонами, чек-листами и калькуляторами.</p>
      <ResourceManager items={JSON.parse(JSON.stringify(items))} />
    </div>
  );
}
