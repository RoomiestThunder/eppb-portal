import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recommendServices, answerFaq, explainServiceSimply } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const { message } = (await req.json()) as { message: string };
  if (!message || !message.trim()) {
    return NextResponse.json({ reply: "Опишите, какая помощь вам нужна — например, «хочу купить вагоны в лизинг».", recommendations: [] });
  }

  const services = await prisma.service.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, slug: true, name: true, nameKk: true, shortDescription: true, category: true, tags: true },
  });

  const faq = answerFaq(message);
  const recs = recommendServices(message, services);

  let reply: string;
  if (recs.length > 0) {
    reply =
      recs.length === 1
        ? `Похоже, вам подойдёт услуга «${recs[0].service.name}». ${explainServiceSimply(recs[0].service)}`
        : `Нашёл ${recs.length} подходящие меры поддержки. Наиболее релевантная — «${recs[0].service.name}».`;
    if (faq) reply += `\n\n${faq}`;
  } else if (faq) {
    reply = faq;
  } else {
    reply =
      "Не нашёл точного совпадения. Попробуйте описать вашу задачу иначе (например: «лизинг вагонов», «субсидия на скот», «страхование экспорта») или откройте каталог услуг.";
  }

  return NextResponse.json({ reply, recommendations: recs });
}
