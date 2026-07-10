import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { pickLocalized, pickCategory, t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export default async function HomePage() {
  const locale = await getLocale();
  const services = await prisma.service.findMany({
    where: { status: "PUBLISHED" },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
  const featured = services.filter((s) => s.complexity === "multi-stage");
  const categories = Array.from(new Set(services.map((s) => s.category)));
  const orgCount = await prisma.organization.count();
  const projectCount = await prisma.project.count();
  const regionCount = (await prisma.lookup.findUnique({ where: { code: "regions" }, include: { items: true } }))?.items.length ?? 0;

  const howItWorks = [
    ["1", t(locale, "howStep1Title"), t(locale, "howStep1Body")],
    ["2", t(locale, "howStep2Title"), t(locale, "howStep2Body")],
    ["3", t(locale, "howStep3Title"), t(locale, "howStep3Body")],
    ["4", t(locale, "howStep4Title"), t(locale, "howStep4Body")],
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand to-brand-dark text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <p className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs tracking-wide text-white/80">
            {t(locale, "homeHeroTag")}
          </p>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">{t(locale, "homeHeroTitle")}</h1>
          <p className="mt-4 max-w-2xl text-white/80">{t(locale, "homeHeroBody")}</p>

          <form action="/services" className="mt-8 flex max-w-xl gap-2 rounded-full bg-white p-1.5 shadow-lg">
            <input
              name="q"
              placeholder={t(locale, "homeSearchPlaceholder")}
              className="min-w-0 flex-1 rounded-full px-4 py-2.5 text-slate-800 outline-none"
            />
            <button type="submit" className="shrink-0 whitespace-nowrap rounded-full bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-dark">
              {t(locale, "homeSearchButton")}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/services" className="whitespace-nowrap rounded-full border border-white/30 px-4 py-2 hover:bg-white/10">
              {t(locale, "homeOpenCatalog")}
            </Link>
            <Link href="/cabinet" className="whitespace-nowrap rounded-full border border-white/30 px-4 py-2 hover:bg-white/10">
              {t(locale, "homeMyApplications")}
            </Link>
            <span className="whitespace-nowrap rounded-full border border-dashed border-white/30 px-4 py-2 text-white/70">
              {t(locale, "homeAskAi")}
            </span>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { label: t(locale, "statServices"), value: services.length },
              { label: t(locale, "statOrgs"), value: orgCount },
              { label: t(locale, "statProjects"), value: projectCount },
              { label: t(locale, "statRegions"), value: regionCount },
            ].map((s) => (
              <div key={s.label}>
                <dt className="text-3xl font-bold">{s.value}+</dt>
                <dd className="text-sm text-white/70">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-slate-900">{t(locale, "howItWorksTitle")}</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map(([n, title, d]) => (
            <div key={n} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 font-semibold text-brand">
                {n}
              </div>
              <h3 className="font-medium text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-500">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-slate-900">{t(locale, "directionsTitle")}</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {categories.map((c) => (
            <Link
              key={c}
              href={`/services?category=${encodeURIComponent(c)}`}
              className="whitespace-nowrap rounded-full border border-brand/20 bg-brand/5 px-4 py-2 text-sm font-medium text-brand hover:bg-brand/10"
            >
              {pickCategory(c, locale)}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured control-case services */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">{t(locale, "popularTitle")}</h2>
          <Link href="/services" className="whitespace-nowrap text-sm font-medium text-brand hover:underline">
            {t(locale, "allServices")} →
          </Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {featured.map((s) => (
            <Link
              key={s.id}
              href={`/services/${s.slug}`}
              className="group rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: s.organization.logoColor }}
              >
                {s.organization.shortName}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-slate-900 group-hover:text-brand">
                {pickLocalized(s.name, s.nameKk, locale)}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{pickLocalized(s.shortDescription, s.shortDescriptionKk, locale)}</p>
              <span className="mt-4 inline-block text-sm font-medium text-brand">{t(locale, "applyNow")} →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Cross-links to other MVP blocks */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-3">
          <Link href="/analytics" className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm hover:shadow-md">
            <h3 className="font-semibold text-slate-900">{t(locale, "analyticsCardTitle")}</h3>
            <p className="mt-1 text-sm text-slate-500">{t(locale, "analyticsCardBody")}</p>
          </Link>
          <Link href="/map" className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm hover:shadow-md">
            <h3 className="font-semibold text-slate-900">{t(locale, "mapCardTitle")}</h3>
            <p className="mt-1 text-sm text-slate-500">{t(locale, "mapCardBody")}</p>
          </Link>
          <Link href="/tools" className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm hover:shadow-md">
            <h3 className="font-semibold text-slate-900">{t(locale, "toolsCardTitle")}</h3>
            <p className="mt-1 text-sm text-slate-500">{t(locale, "toolsCardBody")}</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
