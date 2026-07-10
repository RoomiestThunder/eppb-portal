import { BookOpen, FileText, ListChecks, Calculator, GraduationCap } from "lucide-react";
import { prisma } from "@/lib/prisma";
import ResourceGrid from "@/components/ResourceGrid";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

const CATEGORY_LABEL_KEY: Record<string, "categoryKnowledgeBase" | "categoryTemplate" | "categoryChecklist" | "categoryCalculator" | "categoryGuide"> = {
  knowledge_base: "categoryKnowledgeBase",
  template: "categoryTemplate",
  checklist: "categoryChecklist",
  calculator: "categoryCalculator",
  guide: "categoryGuide",
};

const CATEGORY_ICON: Record<string, typeof BookOpen> = {
  knowledge_base: BookOpen,
  template: FileText,
  checklist: ListChecks,
  calculator: Calculator,
  guide: GraduationCap,
};

export default async function ToolsPage() {
  const locale = await getLocale();
  const items = await prisma.resourceItem.findMany({ orderBy: { createdAt: "asc" } });
  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">{t(locale, "toolsTitle")}</h1>
      <p className="mt-1 text-slate-500">{t(locale, "toolsSubtitle")}</p>

      <div className="mt-8 space-y-10">
        {categories.map((cat) => {
          const Icon = CATEGORY_ICON[cat];
          const labelKey = CATEGORY_LABEL_KEY[cat];
          return (
          <div key={cat}>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              {Icon && <Icon className="h-5 w-5 text-brand" strokeWidth={2} />}
              {labelKey ? t(locale, labelKey) : cat}
            </h2>
            <ResourceGrid
              locale={locale}
              items={items
                .filter((i) => i.category === cat)
                .map((i) => ({ id: i.id, title: i.title, titleKk: i.titleKk, description: i.description, descriptionKk: i.descriptionKk, linkUrl: i.linkUrl }))}
            />
          </div>
          );
        })}
      </div>
    </div>
  );
}
