import type { FormField } from "@/generated/prisma";
import type { WizardField } from "@/components/ApplicationWizard";

export function toWizardField(f: FormField): WizardField {
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
    label: f.label,
    hint: f.hint,
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
