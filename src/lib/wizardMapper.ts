import type { FormField } from "@/generated/prisma";
import type { WizardField } from "@/components/ApplicationWizard";
import { pickLocalized, type Locale } from "@/lib/i18n";

export function toWizardField(f: FormField, locale: Locale = "ru"): WizardField {
  let options: string[] = [];
  try {
    options = f.options ? JSON.parse(f.options) : [];
  } catch {
    options = [];
  }
  let validation: WizardField["validation"] = null;
  try {
    validation = f.validation ? JSON.parse(f.validation) : null;
  } catch {
    validation = null;
  }
  return {
    id: f.id,
    key: f.key,
    label: pickLocalized(f.label, f.labelKk, locale),
    hint: pickLocalized(f.hint, f.hintKk, locale),
    type: f.type,
    required: f.required,
    options,
    lookupCode: f.lookupCode,
    formula: f.formula,
    visibilityRule: f.visibilityRule,
    validation,
    prefillSource: f.prefillSource,
  };
}
