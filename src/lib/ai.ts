// AI-компонент ЕППБ.
// Реализован как детерминированный rule-based движок, не зависящий от внешних API-ключей —
// это гарантирует, что демо-стенд работает стабильно у любого члена жюри без сетевых зависимостей.
// Интерфейс намеренно спроектирован как provider-абстракция: движок можно заменить на вызов
// внешней языковой модели без изменения вызывающего кода — см. architecture.md.

import type { Service } from "@/generated/prisma";

export type ServiceForAi = Pick<Service, "id" | "slug" | "name" | "shortDescription" | "category" | "tags">;

export type Recommendation = { service: ServiceForAi; score: number; reason: string };

const STOPWORDS = new Set(["и", "в", "на", "с", "для", "по", "как", "мне", "нужно", "нужна", "хочу", "я", "the", "a"]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

export function recommendServices(query: string, services: ServiceForAi[]): Recommendation[] {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];

  const scored = services.map((s) => {
    const haystack = tokenize(`${s.name} ${s.shortDescription} ${s.category} ${s.tags}`);
    let score = 0;
    const matched: string[] = [];
    for (const qt of qTokens) {
      for (const ht of haystack) {
        if (ht === qt || ht.startsWith(qt) || qt.startsWith(ht)) {
          score += 1;
          matched.push(qt);
          break;
        }
      }
    }
    return { service: s, score, reason: matched.length ? `Совпадение по: ${[...new Set(matched)].join(", ")}` : "" };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

const FAQ: Array<{ keywords: string[]; answer: string }> = [
  {
    keywords: ["бин", "иин", "что такое бин", "что такое иин"],
    answer:
      "БИН (бизнес-идентификационный номер) присваивается юридическим лицам, ИИН — физическим лицам и ИП. При подаче заявки на портале ЕППБ данные организации подтягиваются автоматически по БИН из мок-интеграции с eGov IDP.",
  },
  {
    keywords: ["статус", "заявк", "отследить"],
    answer:
      "Статус заявки отображается в личном кабинете в разделе «Мои заявки». Там же доступна история рассмотрения и уведомления о смене статуса.",
  },
  {
    keywords: ["документ", "какие документы", "что нужно"],
    answer:
      "Перечень документов зависит от выбранной услуги и формируется динамически: часть документов запрашивается сразу, часть — только если это применимо к вашей ситуации (например, для нерезидентов или крупных партий).",
  },
  {
    keywords: ["эцп", "подпис"],
    answer: "Подписание заявки и документов происходит через сервис ЭЦП (в MVP — мок-интеграция с НУЦ РК).",
  },
  {
    keywords: ["как подать", "как оформить", "с чего начать"],
    answer:
      "Найдите подходящую меру поддержки через поиск, каталог или этого AI-помощника, откройте карточку услуги и нажмите «Подать заявку» — портал проведёт вас по шагам.",
  },
];

export function answerFaq(query: string): string | null {
  const q = query.toLowerCase();
  for (const item of FAQ) {
    if (item.keywords.some((k) => q.includes(k))) return item.answer;
  }
  return null;
}

export function explainServiceSimply(service: ServiceForAi): string {
  return `«${service.name}» — это услуга категории «${service.category}». Простыми словами: ${service.shortDescription.toLowerCase()}. Чтобы подать заявку, откройте карточку услуги и нажмите «Подать заявку» — форма разбита на понятные шаги, а часть данных заполнится автоматически.`;
}

export type CompletenessIssue = { fieldKey: string; label: string; message: string };

export function checkApplicationCompleteness(
  fields: Array<{ key: string; label: string; required: boolean; type: string }>,
  data: Record<string, unknown>
): CompletenessIssue[] {
  const issues: CompletenessIssue[] = [];
  for (const f of fields) {
    if (!f.required) continue;
    const val = data[f.key];
    const empty = val === undefined || val === null || val === "";
    if (empty) {
      issues.push({ fieldKey: f.key, label: f.label, message: "Обязательное поле не заполнено" });
      continue;
    }
    if (f.type === "NUMBER" && Number.isNaN(Number(val))) {
      issues.push({ fieldKey: f.key, label: f.label, message: "Значение должно быть числом" });
    }
  }
  return issues;
}

// ---------- Admin/author-facing: draft service structure suggestion ----------

type DraftField = {
  key: string;
  label: string;
  type: string;
  required: boolean;
  hint?: string;
};

type DraftStep = { title: string; fields: DraftField[] };

const TEMPLATES: Array<{ match: string[]; category: string; steps: DraftStep[] }> = [
  {
    match: ["лизинг", "аренд"],
    category: "Лизинг",
    steps: [
      {
        title: "Данные заявителя",
        fields: [
          { key: "applicant_bin", label: "БИН компании", type: "TEXT", required: true, hint: "Автозаполнение по eGov" },
          { key: "company_name", label: "Наименование организации", type: "TEXT", required: true },
        ],
      },
      {
        title: "Предмет лизинга",
        fields: [
          { key: "asset_type", label: "Тип имущества", type: "LOOKUP", required: true },
          { key: "asset_count", label: "Количество единиц", type: "NUMBER", required: true },
          { key: "unit_price", label: "Стоимость за единицу", type: "NUMBER", required: true },
          { key: "total_price", label: "Итоговая стоимость", type: "CALCULATED", required: false, hint: "asset_count * unit_price" },
        ],
      },
      {
        title: "Документы",
        fields: [
          { key: "doc_charter", label: "Устав", type: "FILE", required: true },
          { key: "doc_financials", label: "Финансовая отчетность", type: "FILE", required: true },
        ],
      },
    ],
  },
  {
    match: ["субсид", "поддержк", "грант"],
    category: "Субсидирование",
    steps: [
      {
        title: "Данные заявителя",
        fields: [{ key: "applicant_bin", label: "БИН/ИИН", type: "TEXT", required: true }],
      },
      {
        title: "Расчет субсидии",
        fields: [
          { key: "base_value", label: "Базовый показатель (объем/поголовье/площадь)", type: "NUMBER", required: true },
          { key: "rate", label: "Ставка субсидирования", type: "NUMBER", required: true },
          { key: "subsidy_amount", label: "Сумма субсидии", type: "CALCULATED", required: false, hint: "base_value * rate" },
        ],
      },
    ],
  },
  {
    match: ["кредит", "займ", "финансир"],
    category: "Кредитование",
    steps: [
      {
        title: "Данные заявителя",
        fields: [{ key: "applicant_bin", label: "БИН", type: "TEXT", required: true }],
      },
      {
        title: "Параметры кредита",
        fields: [
          { key: "requested_amount", label: "Запрашиваемая сумма", type: "NUMBER", required: true },
          { key: "term_months", label: "Срок, мес.", type: "NUMBER", required: true },
        ],
      },
    ],
  },
  {
    match: ["страхован", "гаранти"],
    category: "Страхование",
    steps: [
      {
        title: "Данные заявителя",
        fields: [{ key: "applicant_bin", label: "БИН", type: "TEXT", required: true }],
      },
      {
        title: "Объект страхования/гарантии",
        fields: [
          { key: "insured_amount", label: "Страховая сумма", type: "NUMBER", required: true },
          { key: "risk_description", label: "Описание риска", type: "TEXTAREA", required: true },
        ],
      },
    ],
  },
];

export function suggestServiceStructure(description: string): { category: string; steps: DraftStep[] } {
  const text = description.toLowerCase();
  const found = TEMPLATES.find((t) => t.match.some((m) => text.includes(m)));
  if (found) return { category: found.category, steps: found.steps };
  return {
    category: "Другое",
    steps: [
      {
        title: "Данные заявителя",
        fields: [
          { key: "applicant_bin", label: "БИН/ИИН заявителя", type: "TEXT", required: true },
          { key: "request_description", label: "Описание запроса", type: "TEXTAREA", required: true },
        ],
      },
      { title: "Документы", fields: [{ key: "doc_main", label: "Основной пакет документов", type: "FILE", required: true }] },
    ],
  };
}
