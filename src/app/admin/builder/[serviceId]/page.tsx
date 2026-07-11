import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ServiceBuilder from "@/components/admin/ServiceBuilder";

export default async function ServiceBuilderPage({ params }: { params: Promise<{ serviceId: string }> }) {
  const { serviceId } = await params;

  const [service, organizations, lookups] = await Promise.all([
    prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        organization: true,
        stages: {
          orderBy: { order: "asc" },
          include: { steps: { orderBy: { order: "asc" }, include: { fields: { orderBy: { order: "asc" } } } } },
        },
      },
    }),
    prisma.organization.findMany({ orderBy: { name: "asc" } }),
    prisma.lookup.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!service) notFound();

  return (
    <ServiceBuilder
      service={JSON.parse(JSON.stringify(service))}
      organizations={organizations.map((o) => ({ id: o.id, name: o.shortName }))}
      lookupCodes={lookups.map((l) => ({ code: l.code, name: l.name }))}
    />
  );
}
