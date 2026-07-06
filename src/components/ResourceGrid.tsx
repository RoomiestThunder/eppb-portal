"use client";

import { useState } from "react";
import Link from "next/link";

const INLINE_CONTENT: Record<string, string> = {
  "#template-business-plan":
    "Структура шаблона: 1) Резюме проекта  2) Описание компании и продукта  3) Анализ рынка и конкурентов  4) Производственный план  5) Организационный план  6) Финансовый план и расчет окупаемости  7) Оценка рисков. Заполненный шаблон прикладывается на шаге «Документы» при подаче заявки.",
  "#checklist-leasing-docs":
    "Чек-лист: Устав / учредительные документы · Финансовая отчетность за последний год · Бизнес-план (для партий от 10 единиц) · Документы нерезидента при необходимости · Коммерческое предложение поставщика · Документы по предлагаемому обеспечению.",
  "#checklist-export-ready":
    "Самопроверка: контракт с иностранным покупателем оформлен · товар соответствует экспортным требованиям страны назначения · логистическая схема поставки определена · валютная выручка планируется на счет в РК · компания не имеет налоговой задолженности.",
  "#video-guide":
    "Видео-инструкция (заглушка MVP): 1. Войдите через eGov IDP  2. Найдите услугу через поиск, каталог или AI-помощника  3. Заполните пошаговую форму  4. Отправьте заявку и следите за статусом в личном кабинете.",
};

export default function ResourceGrid({ items }: { items: { id: string; title: string; description: string; linkUrl: string }[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => {
        const isInline = i.linkUrl.startsWith("#");
        const isOpen = openId === i.id;
        if (isInline) {
          return (
            <div key={i.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <button onClick={() => setOpenId(isOpen ? null : i.id)} className="text-left">
                <h3 className="font-medium text-slate-900">{i.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{i.description}</p>
              </button>
              {isOpen && (
                <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                  {INLINE_CONTENT[i.linkUrl] ?? "Материал в разработке."}
                </p>
              )}
            </div>
          );
        }
        return (
          <Link
            key={i.id}
            href={i.linkUrl}
            target={i.linkUrl.startsWith("http") ? "_blank" : undefined}
            className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm hover:shadow-md"
          >
            <h3 className="font-medium text-slate-900">{i.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{i.description}</p>
          </Link>
        );
      })}
    </div>
  );
}
