import { prisma } from "@/lib/prisma";
import { getSession, ORG_SCOPED_ROLES } from "@/lib/session";
import ProjectManager from "@/components/admin/ProjectManager";

export default async function AdminMapPage() {
  const session = await getSession();
  const scoped = session && ORG_SCOPED_ROLES.includes(session.role);

  const [projects, organizations] = await Promise.all([
    prisma.project.findMany({
      where: scoped ? { organizationId: session!.organizationId! } : undefined,
      include: { organization: true },
      orderBy: { name: "asc" },
    }),
    prisma.organization.findMany({
      where: scoped ? { id: session!.organizationId! } : undefined,
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Карта проектов</h1>
      <p className="mt-1 text-slate-500">Управление проектами, отображаемыми на публичной интерактивной карте.</p>
      <ProjectManager projects={JSON.parse(JSON.stringify(projects))} organizations={organizations.map((o) => ({ id: o.id, name: o.shortName }))} />
    </div>
  );
}
