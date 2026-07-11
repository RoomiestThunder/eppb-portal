import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession, ORG_SCOPED_ROLES } from "@/lib/session";
import CreateServiceButton from "@/components/admin/CreateServiceButton";

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  PUBLISHED: "bg-emerald-50 text-emerald-700",
  ARCHIVED: "bg-red-50 text-red-600",
};
const STATUS_LABEL: Record<string, string> = { DRAFT: "Черновик", PUBLISHED: "Опубликовано", ARCHIVED: "В архиве" };

export default async function ConstructorListPage() {
  const session = await getSession();
  const scoped = session && ORG_SCOPED_ROLES.includes(session.role);

  const [services, organizations] = await Promise.all([
    prisma.service.findMany({
      where: scoped ? { organizationId: session!.organizationId! } : undefined,
      include: { organization: true, stages: { include: { steps: { include: { fields: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.organization.findMany({
      where: scoped ? { id: session!.organizationId! } : undefined,
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Конструктор услуг</h1>
          <p className="mt-1 text-slate-500">No-code сборка карточек, шагов, полей и условий отображения — без разработки.</p>
        </div>
        <CreateServiceButton organizations={organizations.map((o) => ({ id: o.id, name: o.shortName }))} />
      </div>

      <div className="mt-8 space-y-3">
        {services.map((s) => {
          const fieldCount = s.stages.reduce((a, st) => a + st.steps.reduce((b, step) => b + step.fields.length, 0), 0);
          return (
            <Link
              key={s.id}
              href={`/admin/builder/${s.id}`}
              className="flex items-center justify-between rounded-2xl border border-black/5 bg-white p-5 shadow-sm hover:shadow-md"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-medium text-slate-900">{s.name}</h2>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[s.status]}`}>{STATUS_LABEL[s.status]}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {s.organization.shortName} · {s.category} · {s.stages.length} этап(ов) · {fieldCount} полей
                </p>
              </div>
              <span className="text-brand">Открыть →</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
