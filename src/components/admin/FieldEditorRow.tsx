"use client";

import { useState } from "react";
import { wrapCondition, unwrapCondition, type ConditionLeaf } from "@/lib/ruleEngine";

type FieldT = {
  id: string;
  key: string;
  label: string;
  labelKk: string | null;
  hint: string;
  hintKk: string | null;
  type: string;
  required: boolean;
  options: string;
  lookupCode: string | null;
  formula: string | null;
  visibilityRule: string | null;
  validation: string | null;
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const OPERATORS: { value: string; label: string }[] = [
  { value: "eq", label: "равно" },
  { value: "neq", label: "не равно" },
  { value: "gt", label: "больше" },
  { value: "gte", label: "больше или равно" },
  { value: "lt", label: "меньше" },
  { value: "lte", label: "меньше или равно" },
  { value: "isEmpty", label: "пусто" },
  { value: "isNotEmpty", label: "не пусто" },
];

export default function FieldEditorRow({
  field,
  availableFields,
  lookupCodes,
  fieldTypes,
  readOnly = false,
  onSave,
  onDelete,
}: {
  field: FieldT;
  availableFields: { id: string; key: string; label: string }[];
  lookupCodes: { code: string; name: string }[];
  fieldTypes: string[];
  readOnly?: boolean;
  onSave: (data: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  // field.visibilityRule may be a bare legacy condition (all of prisma/seed.ts) or the current
  // versioned envelope { __v: 1, condition } — unwrapCondition() handles both transparently.
  const rawCondition = safeParse<unknown>(field.visibilityRule, null);
  const condition = rawCondition ? (unwrapCondition(rawCondition) as ConditionLeaf) : null;
  const [condEnabled, setCondEnabled] = useState(!!condition);
  const [condField, setCondField] = useState(condition?.field ?? availableFields[0]?.key ?? "");
  const [condOp, setCondOp] = useState<string>(condition?.op ?? "eq");
  const [condValue, setCondValue] = useState(condition?.value !== undefined ? String(condition.value) : "");

  const optionsArr = safeParse<string[]>(field.options, []);
  const validationObj = safeParse<Record<string, number>>(field.validation, {});

  function saveCondition(enabled: boolean, f: string, op: string, value: string) {
    if (!enabled) {
      onSave({ visibilityRule: null });
      return;
    }
    const leaf: ConditionLeaf = {
      field: f,
      op: op as ConditionLeaf["op"],
      value: ["gt", "gte", "lt", "lte"].includes(op) ? Number(value) : value,
    };
    onSave({ visibilityRule: JSON.stringify(wrapCondition(leaf)) });
  }

  return (
    <div className="rounded-xl border border-black/10 p-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setExpanded((v) => !v)} className="text-slate-400">
          {expanded ? "▾" : "▸"}
        </button>
        <input
          defaultValue={field.label}
          disabled={readOnly}
          onBlur={(e) => e.target.value !== field.label && onSave({ label: e.target.value })}
          className="flex-1 rounded-lg border border-transparent px-2 py-1 text-sm font-medium hover:border-black/10 focus:border-brand"
        />
        <select
          defaultValue={field.type}
          disabled={readOnly}
          onChange={(e) => onSave({ type: e.target.value })}
          className="rounded-lg border border-black/10 px-2 py-1 text-xs"
        >
          {fieldTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-xs text-slate-500">
          <input type="checkbox" disabled={readOnly} defaultChecked={field.required} onChange={(e) => onSave({ required: e.target.checked })} />
          обязат.
        </label>
        {!readOnly && (
          <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-600">
            ✕
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-dashed border-black/10 pt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Machine key (переменная)</label>
              <input
                defaultValue={field.key}
                disabled={readOnly}
                onBlur={(e) => e.target.value !== field.key && onSave({ key: e.target.value })}
                className="w-full rounded-lg border border-black/10 px-2 py-1.5 font-mono text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Подсказка (hint) для пользователя</label>
              <input
                defaultValue={field.hint}
                disabled={readOnly}
                onBlur={(e) => e.target.value !== field.hint && onSave({ hint: e.target.value })}
                className="w-full rounded-lg border border-black/10 px-2 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Название поля (қазақша)</label>
              <input
                defaultValue={field.labelKk ?? ""}
                disabled={readOnly}
                onBlur={(e) => e.target.value !== (field.labelKk ?? "") && onSave({ labelKk: e.target.value || null })}
                placeholder="Аудармасы, көрсетілмесе — орысша нұсқасы"
                className="w-full rounded-lg border border-black/10 px-2 py-1.5 text-xs italic"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Подсказка (қазақша)</label>
              <input
                defaultValue={field.hintKk ?? ""}
                disabled={readOnly}
                onBlur={(e) => e.target.value !== (field.hintKk ?? "") && onSave({ hintKk: e.target.value || null })}
                className="w-full rounded-lg border border-black/10 px-2 py-1.5 text-xs italic"
              />
            </div>
          </div>

          {(field.type === "SELECT" || field.type === "RADIO") && (
            <div>
              <label className="mb-1 block text-xs text-slate-400">Варианты ответа (через запятую)</label>
              <input
                defaultValue={optionsArr.join(", ")}
                disabled={readOnly}
                onBlur={(e) =>
                  onSave({ options: JSON.stringify(e.target.value.split(",").map((s) => s.trim()).filter(Boolean)) })
                }
                className="w-full rounded-lg border border-black/10 px-2 py-1.5 text-xs"
              />
            </div>
          )}

          {field.type === "LOOKUP" && (
            <div>
              <label className="mb-1 block text-xs text-slate-400">Справочник</label>
              <select
                defaultValue={field.lookupCode ?? ""}
                disabled={readOnly}
                onChange={(e) => onSave({ lookupCode: e.target.value })}
                className="w-full rounded-lg border border-black/10 px-2 py-1.5 text-xs"
              >
                <option value="">— выбрать —</option>
                {lookupCodes.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name} ({l.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {field.type === "CALCULATED" && (
            <div>
              <label className="mb-1 block text-xs text-slate-400">Формула (ссылайтесь на machine key других полей)</label>
              <input
                defaultValue={field.formula ?? ""}
                disabled={readOnly}
                onBlur={(e) => onSave({ formula: e.target.value })}
                placeholder="round(wagon_count * unit_price)"
                className="w-full rounded-lg border border-black/10 px-2 py-1.5 font-mono text-xs"
              />
              <p className="mt-1 text-[11px] text-slate-400">Доступно: + − × ÷, round(), sum(), max(), min(), abs()</p>
            </div>
          )}

          {field.type === "NUMBER" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Минимум</label>
                <input
                  type="number"
                  defaultValue={validationObj.min}
                  disabled={readOnly}
                  onBlur={(e) => onSave({ validation: JSON.stringify({ ...validationObj, min: e.target.value ? Number(e.target.value) : undefined }) })}
                  className="w-full rounded-lg border border-black/10 px-2 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Максимум</label>
                <input
                  type="number"
                  defaultValue={validationObj.max}
                  disabled={readOnly}
                  onBlur={(e) => onSave({ validation: JSON.stringify({ ...validationObj, max: e.target.value ? Number(e.target.value) : undefined }) })}
                  className="w-full rounded-lg border border-black/10 px-2 py-1.5 text-xs"
                />
              </div>
            </div>
          )}

          {/* Visibility / branching logic */}
          <div className="rounded-lg bg-slate-50 p-3">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                disabled={readOnly}
                checked={condEnabled}
                onChange={(e) => {
                  setCondEnabled(e.target.checked);
                  saveCondition(e.target.checked, condField, condOp, condValue);
                }}
              />
              Показывать поле только при условии (логика ветвления)
            </label>
            {condEnabled && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span>Если</span>
                <select
                  value={condField}
                  disabled={readOnly}
                  onChange={(e) => {
                    setCondField(e.target.value);
                    saveCondition(true, e.target.value, condOp, condValue);
                  }}
                  className="rounded-lg border border-black/10 px-2 py-1"
                >
                  {availableFields.map((f) => (
                    <option key={f.id} value={f.key}>
                      {f.label} ({f.key})
                    </option>
                  ))}
                </select>
                <select
                  value={condOp}
                  disabled={readOnly}
                  onChange={(e) => {
                    setCondOp(e.target.value);
                    saveCondition(true, condField, e.target.value, condValue);
                  }}
                  className="rounded-lg border border-black/10 px-2 py-1"
                >
                  {OPERATORS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {!["isEmpty", "isNotEmpty"].includes(condOp) && (
                  <input
                    value={condValue}
                    disabled={readOnly}
                    onChange={(e) => setCondValue(e.target.value)}
                    onBlur={() => saveCondition(true, condField, condOp, condValue)}
                    placeholder="значение"
                    className="w-28 rounded-lg border border-black/10 px-2 py-1"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
