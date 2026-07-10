"use client";

import { useState } from "react";
import Link from "next/link";
import { pickLocalized, t, type Locale } from "@/lib/i18n";

const INLINE_CONTENT: Record<string, string> = {
  "#guide-choose-service":
    "1) Определите задачу: закупка оборудования, пополнение оборотных средств, экспорт, животноводство или растениеводство. 2) Откройте каталог услуг и отфильтруйте по категории или организации. 3) Сравните карточки услуг — там указано число шагов и документов ещё до начала заявки. 4) Если не уверены — опишите задачу AI-помощнику, он подберёт подходящую услугу по свободному описанию. 5) Подайте заявку — часть данных подтянется автоматически по БИН/ИИН.",
  "#template-business-plan":
    "Структура шаблона: 1) Резюме проекта  2) Описание компании и продукта  3) Анализ рынка и конкурентов  4) Производственный план  5) Организационный план  6) Финансовый план и расчет окупаемости  7) Оценка рисков. Заполненный шаблон прикладывается на шаге «Документы» при подаче заявки.",
  "#checklist-leasing-docs":
    "Чек-лист: Устав / учредительные документы · Финансовая отчетность за последний год · Бизнес-план (для партий от 10 единиц) · Документы нерезидента при необходимости · Коммерческое предложение поставщика · Документы по предлагаемому обеспечению.",
  "#checklist-export-ready":
    "Самопроверка: контракт с иностранным покупателем оформлен · товар соответствует экспортным требованиям страны назначения · логистическая схема поставки определена · валютная выручка планируется на счет в РК · компания не имеет налоговой задолженности.",
  "#video-guide":
    "Видео-инструкция (заглушка MVP): 1. Войдите через eGov IDP  2. Найдите услугу через поиск, каталог или AI-помощника  3. Заполните пошаговую форму  4. Отправьте заявку и следите за статусом в личном кабинете.",
};

const INLINE_CONTENT_KK: Record<string, string> = {
  "#guide-choose-service":
    "1) Міндетті анықтаңыз: жабдық сатып алу, айналым қаражатын толықтыру, экспорт, мал немесе өсімдік шаруашылығы. 2) Қызметтер каталогын ашып, санат немесе ұйым бойынша сүзіңіз. 3) Қызмет карточкаларын салыстырыңыз — онда өтінім берместен бұрын қадамдар мен құжаттар саны көрсетілген. 4) Сенімді болмасаңыз — міндетті AI-көмекшіге сипаттаңыз, ол еркін сипаттама бойынша қолайлы қызметті таңдайды. 5) Өтінім беріңіз — деректердің бір бөлігі БСН/ЖСН бойынша автоматты түрде толтырылады.",
  "#template-business-plan":
    "Үлгі құрылымы: 1) Жоба резюмесі  2) Компания мен өнім сипаттамасы  3) Нарық пен бәсекелестерді талдау  4) Өндірістік жоспар  5) Ұйымдастыру жоспары  6) Қаржы жоспары және өтелу есебі  7) Тәуекелдерді бағалау. Толтырылған үлгі өтінім берген кезде «Құжаттар» қадамында тіркеледі.",
  "#checklist-leasing-docs":
    "Тізбе: Жарғы / құрылтай құжаттары · Соңғы жылғы қаржылық есептілік · Бизнес-жоспар (10 бірліктен көп партия үшін) · Қажет болған жағдайда резидент еместер құжаттары · Жеткізушінің коммерциялық ұсынысы · Ұсынылатын қамтамасыз ету бойынша құжаттар.",
  "#checklist-export-ready":
    "Өзін-өзі тексеру: шетелдік сатып алушымен келісімшарт ресімделген · тауар межелі елдің экспорттық талаптарына сай · жеткізудің логистикалық схемасы анықталған · валюталық түсім ҚР-дағы шотқа жоспарланған · компанияда салықтық берешек жоқ.",
  "#video-guide":
    "Бейне нұсқаулық (MVP тапсырыс): 1. eGov IDP арқылы кіріңіз  2. Іздеу, каталог немесе AI-көмекші арқылы қызметті табыңыз  3. Қадамдық форманы толтырыңыз  4. Өтінімді жіберіп, жеке кабинетте мәртебесін қадағалаңыз.",
};

type ResourceItemVM = { id: string; title: string; titleKk: string | null; description: string; descriptionKk: string | null; linkUrl: string };

export default function ResourceGrid({ items, locale }: { items: ResourceItemVM[]; locale: Locale }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const content = locale === "kk" ? INLINE_CONTENT_KK : INLINE_CONTENT;

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => {
        const isInline = i.linkUrl.startsWith("#");
        const isOpen = openId === i.id;
        const title = pickLocalized(i.title, i.titleKk, locale);
        const description = pickLocalized(i.description, i.descriptionKk, locale);
        if (isInline) {
          return (
            <div key={i.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <button onClick={() => setOpenId(isOpen ? null : i.id)} className="text-left">
                <h3 className="font-medium text-slate-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              </button>
              {isOpen && (
                <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                  {content[i.linkUrl] ?? t(locale, "materialInDevelopment")}
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
            <h3 className="font-medium text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </Link>
        );
      })}
    </div>
  );
}
