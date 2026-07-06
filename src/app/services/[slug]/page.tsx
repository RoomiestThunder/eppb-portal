import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ServiceIcon from "@/components/ServiceIcon";

export default async function ServiceCardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await prisma.service.findUnique({
    where: { slug },
    include: {
      organization: true,
      stages: {
        orderBy: { order: "asc" },
        include: { steps: { orderBy: { order: "asc" }, include: { fields: { orderBy: { order: "asc" } } } } },
      },
    },
  });
  if (!service || service.status !== "PUBLISHED") notFound();

  const allFields = service.stages.flatMap((st) => st.steps.flatMap((s) => s.fields));
  const docFields = allFields.filter((f) => f.type === "FILE");
  const totalSteps = service.stages.reduce((acc, st) => acc + st.steps.length, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="text-sm text-slate-400">
        <Link href="/services" className="hover:text-brand">Каталог услуг</Link> / {service.category}
      </nav>

      <div className="mt-4 flex flex-col gap-6 rounded-2xl border border-black/5 bg-white p-8 shadow-sm sm:flex-row sm:items-start">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand/10">
          <ServiceIcon name={service.icon} className="h-9 w-9 text-brand" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full px-3 py-1 text-xs font-medium text-white" style={{ backgroundColor: service.organization.logoColor }}>
              {service.organization.name}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{service.category}</span>
            {service.complexity === "multi-stage" && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">многоэтапная услуга</span>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">{service.name}</h1>
          <p className="mt-2 text-slate-600">{service.fullDescription || service.shortDescription}</p>

          <div className="mt-6 flex flex-wrap gap-6 text-sm text-slate-500">
            <span>📝 {totalSteps} {totalSteps === 1 ? "шаг" : "шагов"} в {service.stages.length} {service.stages.length === 1 ? "этапе" : "этапах"}</span>
            <span>📎 Документов: {docFields.length}</span>
          </div>

          <Link
            href={`/services/${service.slug}/apply`}
            className="mt-6 inline-block rounded-full bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark"
          >
            Подать заявку →
          </Link>
        </div>
      </div>

      {/* Journey overview */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Как проходит подача заявки</h2>
        <div className="mt-4 space-y-6">
          {service.stages.map((stage) => (
            <div key={stage.id} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <h3 className="font-medium text-slate-900">
                Этап {stage.order}. {stage.title}
              </h3>
              {stage.description && <p className="mt-1 text-sm text-slate-500">{stage.description}</p>}
              <ol className="mt-4 grid gap-3 sm:grid-cols-2">
                {stage.steps.map((step) => (
                  <li key={step.id} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                      {step.order}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{step.title}</p>
                      <p className="text-xs text-slate-500">{step.fields.length} полей</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
