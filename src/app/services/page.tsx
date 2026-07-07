import Link from "next/link";
import { SearchX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import ServiceIcon from "@/components/ServiceIcon";
import EmptyState from "@/components/EmptyState";
import { getLocale, pickLocalized } from "@/lib/i18n";

export default async function ServicesCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; org?: string }>;
}) {
  const { q, category, org } = await searchParams;
  const locale = await getLocale();

  const services = await prisma.service.findMany({
    where: { status: "PUBLISHED" },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  const categories = Array.from(new Set(services.map((s) => s.category)));
  const orgs = Array.from(new Map(services.map((s) => [s.organization.id, s.organization])).values());

  const query = (q ?? "").toLowerCase().trim();
  const filtered = services.filter((s) => {
    if (category && s.category !== category) return false;
    if (org && s.organizationId !== org) return false;
    if (!query) return true;
    const hay = `${s.name} ${s.shortDescription} ${s.tags} ${s.category}`.toLowerCase();
    return query.split(/\s+/).some((t) => hay.includes(t));
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Каталог мер поддержки</h1>
      <p className="mt-1 text-slate-500">
        {services.length} услуг доступно на портале. Найдено по вашему запросу: {filtered.length}.
      </p>

      <form action="/services" className="mt-6 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Поиск по названию, отрасли, задаче…"
          className="flex-1 rounded-full border border-black/10 px-4 py-2.5 outline-none focus:border-brand"
        />
        <button className="rounded-full bg-brand px-5 py-2.5 text-white hover:bg-brand-dark">Найти</button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/services"
          className={`rounded-full px-3 py-1.5 text-sm ${!category ? "bg-brand text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          Все категории
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={`/services?category=${encodeURIComponent(c)}`}
            className={`rounded-full px-3 py-1.5 text-sm ${category === c ? "bg-brand text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {c}
          </Link>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {orgs.map((o) => (
          <Link
            key={o.id}
            href={`/services?org=${o.id}`}
            className={`rounded-full border px-3 py-1 text-xs ${org === o.id ? "border-brand text-brand" : "border-slate-200 text-slate-500 hover:border-brand/40"}`}
          >
            {o.shortName}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <Link
            key={s.id}
            href={`/services/${s.slug}`}
            className="group flex flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <ServiceIcon name={s.icon} className="h-8 w-8 text-brand" />
              {s.complexity === "multi-stage" && (
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                  многоэтапная
                </span>
              )}
            </div>
            <h3 className="mt-3 font-semibold text-slate-900 group-hover:text-brand">{pickLocalized(s.name, s.nameKk, locale)}</h3>
            <p className="mt-1 flex-1 text-sm text-slate-500">{pickLocalized(s.shortDescription, s.shortDescriptionKk, locale)}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
              <span
                className="rounded-full px-2 py-1 font-medium text-white"
                style={{ backgroundColor: s.organization.logoColor }}
              >
                {s.organization.shortName}
              </span>
              <span>{s.category}</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={SearchX}
              title="По вашему запросу ничего не найдено"
              description="Попробуйте изменить формулировку, снять фильтры или спросите AI-помощника внизу справа."
            />
          </div>
        )}
      </div>
    </div>
  );
}
