import { prisma } from "@/lib/prisma";
import ProjectManager from "@/components/admin/ProjectManager";

export default async function AdminMapPage() {
  const [projects, organizations] = await Promise.all([
    prisma.project.findMany({ include: { organization: true }, orderBy: { name: "asc" } }),
    prisma.organization.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Карта проектов</h1>
      <p className="mt-1 text-slate-500">Управление проектами, отображаемыми на публичной интерактивной карте.</p>
      <ProjectManager projects={JSON.parse(JSON.stringify(projects))} organizations={organizations.map((o) => ({ id: o.id, name: o.shortName }))} />
    </div>
  );
}
