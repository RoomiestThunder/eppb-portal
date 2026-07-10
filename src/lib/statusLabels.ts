import type { Locale } from "@/lib/i18n";

// Plain RU labels — used in admin/author screens, which stay Russian-only by design.
export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Черновик",
  SUBMITTED: "Подана",
  IN_REVIEW: "На рассмотрении",
  ADDITIONAL_INFO_REQUIRED: "Требуются доп. данные",
  APPROVED: "Одобрена",
  REJECTED: "Отклонена",
};

const STATUS_LABELS_KK: Record<string, string> = {
  DRAFT: "Қолжазба",
  SUBMITTED: "Берілді",
  IN_REVIEW: "Қаралуда",
  ADDITIONAL_INFO_REQUIRED: "Қосымша деректер қажет",
  APPROVED: "Мақұлданды",
  REJECTED: "Қабылданбады",
};

// Locale-aware lookup — used on client-facing screens (cabinet, application detail).
export function getStatusLabel(status: string, locale: Locale): string {
  return (locale === "kk" ? STATUS_LABELS_KK[status] : STATUS_LABELS[status]) ?? status;
}

export const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-blue-50 text-blue-700",
  IN_REVIEW: "bg-amber-50 text-amber-700",
  ADDITIONAL_INFO_REQUIRED: "bg-orange-50 text-orange-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
};
