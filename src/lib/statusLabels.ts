export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Черновик",
  SUBMITTED: "Подана",
  IN_REVIEW: "На рассмотрении",
  ADDITIONAL_INFO_REQUIRED: "Требуются доп. данные",
  APPROVED: "Одобрена",
  REJECTED: "Отклонена",
};

export const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-blue-50 text-blue-700",
  IN_REVIEW: "bg-amber-50 text-amber-700",
  ADDITIONAL_INFO_REQUIRED: "bg-orange-50 text-orange-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
};
