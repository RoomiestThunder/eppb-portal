import CalculatorClient from "@/components/CalculatorClient";
import { getLocale } from "@/lib/locale";

export default async function CalculatorPage() {
  const locale = await getLocale();
  return <CalculatorClient locale={locale} />;
}
