import { cookies } from "next/headers";
import type { Locale } from "@/lib/i18n";

export const LOCALE_COOKIE = "eppb_locale";
export const DEFAULT_LOCALE: Locale = "ru";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value === "kk" ? "kk" : DEFAULT_LOCALE;
}
