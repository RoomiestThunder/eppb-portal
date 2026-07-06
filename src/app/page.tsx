import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
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

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand to-brand-dark text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <p className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs tracking-wide text-white/80">
            АО «НУХ «Байтерек» и дочерние организации
          </p>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">
            Все меры поддержки бизнеса — в одном окне
          </h1>
          <p className="mt-4 max-w-2xl text-white/80">
            Найдите подходящую меру поддержки, подайте заявку понятным пошаговым сценарием и отслеживайте
            статус — без блуждания по разным сайтам дочерних организаций Холдинга.
          </p>

          <form action="/services" className="mt-8 flex max-w-xl gap-2 rounded-full bg-white p-1.5 shadow-lg">
            <input
              name="q"
              placeholder="Например: лизинг вагонов, субсидия животноводство…"
              className="flex-1 rounded-full px-4 py-2.5 text-slate-800 outline-none"
            />
            <button type="submit" className="rounded-full bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-dark">
              Найти услугу
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/services" className="rounded-full border border-white/30 px-4 py-2 hover:bg-white/10">
              Открыть каталог услуг
            </Link>
            <Link href="/cabinet" className="rounded-full border border-white/30 px-4 py-2 hover:bg-white/10">
              Мои заявки
            </Link>
            <span className="rounded-full border border-dashed border-white/30 px-4 py-2 text-white/70">
              ✨ Спросите AI-помощника (справа внизу)
            </span>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { label: "Услуг на портале", value: services.length },
              { label: "Организаций Холдинга", value: orgCount },
              { label: "Проектов на карте", value: projectCount },
              { label: "Регионов охвата", value: regionCount },
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
        <h2 className="text-2xl font-semibold text-slate-900">Как это работает</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["1", "Найдите услугу", "Через поиск, каталог, категории или AI-помощника"],
            ["2", "Подайте заявку", "Понятный пошаговый сценарий вместо длинной анкеты"],
            ["3", "Отслеживайте статус", "В личном кабинете — статусы, документы, уведомления"],
            ["4", "Получите результат", "Решение и сопровождение до полного завершения услуги"],
          ].map(([n, t, d]) => (
            <div key={n} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 font-semibold text-brand">
                {n}
              </div>
              <h3 className="font-medium text-slate-900">{t}</h3>
              <p className="mt-1 text-sm text-slate-500">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-slate-900">Направления поддержки</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {categories.map((c) => (
            <Link
              key={c}
              href={`/services?category=${encodeURIComponent(c)}`}
              className="rounded-full border border-brand/20 bg-brand/5 px-4 py-2 text-sm font-medium text-brand hover:bg-brand/10"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured control-case services */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">Популярные услуги</h2>
          <Link href="/services" className="text-sm font-medium text-brand hover:underline">
            Все услуги →
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
              <h3 className="mt-3 text-lg font-semibold text-slate-900 group-hover:text-brand">{s.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.shortDescription}</p>
              <span className="mt-4 inline-block text-sm font-medium text-brand">Подать заявку →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Cross-links to other MVP blocks */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-3">
          <Link href="/analytics" className="rounded-2xl bg-white p-6 shadow-sm border border-black/5 hover:shadow-md">
            <h3 className="font-semibold text-slate-900">Аналитическая отчетность</h3>
            <p className="mt-1 text-sm text-slate-500">Дашборды и отчеты дочерних организаций Холдинга</p>
          </Link>
          <Link href="/map" className="rounded-2xl bg-white p-6 shadow-sm border border-black/5 hover:shadow-md">
            <h3 className="font-semibold text-slate-900">Карта проектов</h3>
            <p className="mt-1 text-sm text-slate-500">Проекты, профинансированные группой Холдинга, на карте Казахстана</p>
          </Link>
          <Link href="/tools" className="rounded-2xl bg-white p-6 shadow-sm border border-black/5 hover:shadow-md">
            <h3 className="font-semibold text-slate-900">Инструменты для бизнеса</h3>
            <p className="mt-1 text-sm text-slate-500">База знаний, шаблоны, чек-листы и калькуляторы</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
