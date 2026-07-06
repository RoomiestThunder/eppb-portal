import { prisma } from "@/lib/prisma";
import ResourceGrid from "@/components/ResourceGrid";

const CATEGORY_LABELS: Record<string, string> = {
  knowledge_base: "База знаний",
  template: "Шаблоны документов",
  checklist: "Чек-листы",
  calculator: "Калькуляторы",
  guide: "Обучающие материалы",
};

const CATEGORY_ICON: Record<string, string> = {
  knowledge_base: "📚",
  template: "📄",
  checklist: "✅",
  calculator: "🧮",
  guide: "🎓",
};

export default async function ToolsPage() {
  const items = await prisma.resourceItem.findMany({ orderBy: { createdAt: "asc" } });
  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Инструменты и материалы для развития бизнеса</h1>
      <p className="mt-1 text-slate-500">
        База знаний, шаблоны, чек-листы и калькуляторы, сопровождающие предпринимателя на разных этапах развития бизнеса.
      </p>

      <div className="mt-8 space-y-10">
        {categories.map((cat) => (
          <div key={cat}>
            <h2 className="text-lg font-semibold text-slate-900">
              {CATEGORY_ICON[cat]} {CATEGORY_LABELS[cat] ?? cat}
            </h2>
            <ResourceGrid items={items.filter((i) => i.category === cat).map((i) => ({ id: i.id, title: i.title, description: i.description, linkUrl: i.linkUrl }))} />
          </div>
        ))}
      </div>
    </div>
  );
}
