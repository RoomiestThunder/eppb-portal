import { NextRequest, NextResponse } from "next/server";
import type { Locale } from "@/lib/i18n";
import { LOCALE_COOKIE } from "@/lib/locale";

export async function POST(req: NextRequest) {
  const { locale } = (await req.json()) as { locale: Locale };
  if (locale !== "ru" && locale !== "kk") {
    return NextResponse.json({ error: "invalid locale" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
