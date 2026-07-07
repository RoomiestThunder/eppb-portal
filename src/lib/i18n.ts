import { cookies } from "next/headers";

export type Locale = "ru" | "kk";

export const LOCALE_COOKIE = "eppb_locale";
export const DEFAULT_LOCALE: Locale = "ru";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value === "kk" ? "kk" : DEFAULT_LOCALE;
}

// Picks the Kazakh translation when present and the locale is kk, otherwise falls back to Russian.
export function pickLocalized(ru: string, kk: string | null | undefined, locale: Locale): string {
  if (locale === "kk" && kk && kk.trim().length > 0) return kk;
  return ru;
}

const UI_STRINGS = {
  ru: {
    home: "Главная",
    catalog: "Каталог услуг",
    tools: "Инструменты бизнеса",
    analytics: "Аналитика",
    map: "Карта проектов",
    cabinet: "Личный кабинет",
    admin: "Администрирование",
    login: "Войти",
    logout: "Выйти",
    heroTitle: "Единый портал поддержки бизнеса",
    heroSubtitle: "Все меры поддержки АО «НУХ «Байтерек» и дочерних организаций — в одном месте",
    footerRights: "Все права защищены",
  },
  kk: {
    home: "Басты бет",
    catalog: "Қызметтер каталогы",
    tools: "Бизнес құралдары",
    analytics: "Аналитика",
    map: "Жобалар картасы",
    cabinet: "Жеке кабинет",
    admin: "Әкімшілендіру",
    login: "Кіру",
    logout: "Шығу",
    heroTitle: "Бизнесті қолдаудың бірыңғай порталы",
    heroSubtitle: "«Байтерек» ҰБХ АҚ және еншілес ұйымдардың барлық қолдау шаралары — бір жерде",
    footerRights: "Барлық құқықтар қорғалған",
  },
} as const;

export type UiStringKey = keyof (typeof UI_STRINGS)["ru"];

export function t(locale: Locale, key: UiStringKey): string {
  return UI_STRINGS[locale][key];
}
