// Turns the raw before/after JSON snapshots stored in AuditLog into a short, human-readable
// summary — the constructor is aimed at no-code authors, so a wall of raw JSON per entry isn't
// useful to them. Snapshots are flat (mutate route never includes relations), so a shallow
// key-by-key diff is enough; no need to walk nested objects/arrays.

const FIELD_LABEL: Record<string, string> = {
  name: "Название",
  nameKk: "Название (қаз.)",
  title: "Название",
  titleKk: "Название (қаз.)",
  label: "Подпись",
  labelKk: "Подпись (қаз.)",
  category: "Категория",
  status: "Статус",
  description: "Описание",
  descriptionKk: "Описание (қаз.)",
  shortDescription: "Краткое описание",
  shortDescriptionKk: "Краткое описание (қаз.)",
  fullDescription: "Полное описание",
  fullDescriptionKk: "Полное описание (қаз.)",
  hint: "Подсказка",
  hintKk: "Подсказка (қаз.)",
  type: "Тип",
  required: "Обязательное",
  options: "Варианты",
  formula: "Формула",
  visibilityRule: "Условие показа",
  validation: "Валидация",
  region: "Регион",
  industry: "Отрасль",
  amount: "Сумма",
  locality: "Населенный пункт",
  lat: "Широта",
  lng: "Долгота",
  source: "Источник",
  period: "Период",
  linkUrl: "Ссылка",
  embeddable: "Embedding доступен",
  value: "Значение",
  order: "Порядок",
  materialType: "Тип материала",
  lookupCode: "Справочник",
  key: "Machine key",
  version: "Версия",
  complexity: "Сложность",
  tags: "Теги",
  icon: "Иконка",
  organizationId: "Организация",
  currency: "Валюта",
  periodStart: "Начало периода",
  periodEnd: "Окончание периода",
};

// Internal/FK fields that don't mean anything to a no-code viewer on their own —
// the entityType + entityId columns already identify the record.
const HIDDEN_FIELDS = new Set(["id", "createdAt", "updatedAt", "stepId", "stageId", "serviceId", "lookupId", "slug"]);

export function fieldLabel(key: string): string {
  return FIELD_LABEL[key] ?? key;
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "да" : "нет";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > 120 ? s.slice(0, 120) + "…" : s;
}

export type FieldDiff = { key: string; label: string; before: string; after: string };

function safeParseRecord(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

// Returns only the fields that actually changed between before/after, human-labeled.
export function diffFields(beforeRaw: string | null, afterRaw: string | null): FieldDiff[] {
  const before = safeParseRecord(beforeRaw);
  const after = safeParseRecord(afterRaw);
  const keys = new Set([...(before ? Object.keys(before) : []), ...(after ? Object.keys(after) : [])]);
  const diffs: FieldDiff[] = [];
  for (const key of keys) {
    if (HIDDEN_FIELDS.has(key)) continue;
    const b = before?.[key];
    const a = after?.[key];
    if (JSON.stringify(b) === JSON.stringify(a)) continue;
    diffs.push({ key, label: fieldLabel(key), before: formatValue(b), after: formatValue(a) });
  }
  return diffs;
}

// For create/delete, there's only one side — summarize the record's most identifying fields
// instead of dumping everything.
const SUMMARY_KEYS = ["name", "nameKk", "title", "label", "value", "key"];

export function summarizeRecord(raw: string | null): string {
  const record = safeParseRecord(raw);
  if (!record) return "—";
  for (const key of SUMMARY_KEYS) {
    if (record[key]) return String(record[key]);
  }
  return "—";
}
