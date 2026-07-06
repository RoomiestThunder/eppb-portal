// Universal constructor rule engine
// Evaluates field visibility conditions and calculated-field formulas
// against the current application data, without using eval()/Function().

export type ConditionLeaf = {
  field: string;
  op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "notIn" | "contains" | "isEmpty" | "isNotEmpty";
  value?: unknown;
};

export type ConditionNode =
  | ConditionLeaf
  | { op: "and" | "or"; rules: ConditionNode[] }
  | { op: "not"; rule: ConditionNode };

export type FormDataMap = Record<string, unknown>;

function isLeaf(node: ConditionNode): node is ConditionLeaf {
  return typeof (node as ConditionLeaf).field === "string";
}

export function evaluateCondition(node: ConditionNode, data: FormDataMap): boolean {
  if (isLeaf(node)) {
    const actual = data[node.field];
    switch (node.op) {
      case "eq":
        return String(actual ?? "") === String(node.value ?? "");
      case "neq":
        return String(actual ?? "") !== String(node.value ?? "");
      case "gt":
        return Number(actual) > Number(node.value);
      case "gte":
        return Number(actual) >= Number(node.value);
      case "lt":
        return Number(actual) < Number(node.value);
      case "lte":
        return Number(actual) <= Number(node.value);
      case "in":
        return Array.isArray(node.value) && node.value.map(String).includes(String(actual ?? ""));
      case "notIn":
        return Array.isArray(node.value) && !node.value.map(String).includes(String(actual ?? ""));
      case "contains":
        return String(actual ?? "").toLowerCase().includes(String(node.value ?? "").toLowerCase());
      case "isEmpty":
        return actual === undefined || actual === null || actual === "";
      case "isNotEmpty":
        return !(actual === undefined || actual === null || actual === "");
      default:
        return true;
    }
  }
  if (node.op === "and") return node.rules.every((r) => evaluateCondition(r, data));
  if (node.op === "or") return node.rules.some((r) => evaluateCondition(r, data));
  if (node.op === "not") return !evaluateCondition(node.rule, data);
  return true;
}

export function isFieldVisible(visibilityRule: string | null | undefined, data: FormDataMap): boolean {
  if (!visibilityRule) return true;
  try {
    const parsed = JSON.parse(visibilityRule) as ConditionNode;
    return evaluateCondition(parsed, data);
  } catch {
    return true;
  }
}

// ---------- Safe arithmetic formula evaluator ----------
// Supports: + - * / ( ) numbers, field.identifiers, and functions sum(a,b,...), round(x), max(a,b), min(a,b)
// Deliberately avoids eval()/new Function() since formulas are stored data, not trusted code.

type Token =
  | { t: "num"; v: number }
  | { t: "ident"; v: string }
  | { t: "op"; v: string }
  | { t: "lparen" }
  | { t: "rparen" }
  | { t: "comma" };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < expr.length && /[0-9.]/.test(expr[j])) j++;
      tokens.push({ t: "num", v: parseFloat(expr.slice(i, j)) });
      i = j;
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let j = i;
      while (j < expr.length && /[a-zA-Z0-9_.]/.test(expr[j])) j++;
      tokens.push({ t: "ident", v: expr.slice(i, j) });
      i = j;
      continue;
    }
    if (c === "(") {
      tokens.push({ t: "lparen" });
      i++;
      continue;
    }
    if (c === ")") {
      tokens.push({ t: "rparen" });
      i++;
      continue;
    }
    if (c === ",") {
      tokens.push({ t: "comma" });
      i++;
      continue;
    }
    if ("+-*/".includes(c)) {
      tokens.push({ t: "op", v: c });
      i++;
      continue;
    }
    // unknown char, skip
    i++;
  }
  return tokens;
}

const FUNCS: Record<string, (...args: number[]) => number> = {
  sum: (...args) => args.reduce((a, b) => a + b, 0),
  round: (x, digits = 0) => Number(x.toFixed(digits)),
  max: (...args) => Math.max(...args),
  min: (...args) => Math.min(...args),
  abs: (x) => Math.abs(x),
};

class Parser {
  tokens: Token[];
  pos = 0;
  data: FormDataMap;

  constructor(tokens: Token[], data: FormDataMap) {
    this.tokens = tokens;
    this.data = data;
  }

  peek() {
    return this.tokens[this.pos];
  }

  next() {
    return this.tokens[this.pos++];
  }

  parseExpression(): number {
    let left = this.parseTerm();
    while (this.peek() && this.peek().t === "op" && ["+", "-"].includes((this.peek() as { v: string }).v)) {
      const op = (this.next() as { v: string }).v;
      const right = this.parseTerm();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  parseTerm(): number {
    let left = this.parseFactor();
    while (this.peek() && this.peek().t === "op" && ["*", "/"].includes((this.peek() as { v: string }).v)) {
      const op = (this.next() as { v: string }).v;
      const right = this.parseFactor();
      left = op === "*" ? left * right : left / right;
    }
    return left;
  }

  parseFactor(): number {
    const tok = this.peek();
    if (tok && tok.t === "op" && tok.v === "-") {
      this.next();
      return -this.parseFactor();
    }
    if (tok && tok.t === "num") {
      this.next();
      return tok.v;
    }
    if (tok && tok.t === "lparen") {
      this.next();
      const val = this.parseExpression();
      if (this.peek()?.t === "rparen") this.next();
      return val;
    }
    if (tok && tok.t === "ident") {
      this.next();
      if (this.peek()?.t === "lparen") {
        this.next();
        const args: number[] = [];
        if (this.peek()?.t !== "rparen") {
          args.push(this.parseExpression());
          while (this.peek()?.t === "comma") {
            this.next();
            args.push(this.parseExpression());
          }
        }
        if (this.peek()?.t === "rparen") this.next();
        const fn = FUNCS[tok.v];
        return fn ? fn(...args) : 0;
      }
      const raw = this.data[tok.v];
      const n = typeof raw === "number" ? raw : parseFloat(String(raw ?? "0"));
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  }
}

export function evaluateFormula(formula: string, data: FormDataMap): number | null {
  try {
    const tokens = tokenize(formula);
    if (tokens.length === 0) return null;
    const parser = new Parser(tokens, data);
    const result = parser.parseExpression();
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

// ---------- Composite helpers used by both admin preview and client wizard ----------

export type FieldLike = {
  id: string;
  key: string;
  type: string;
  formula?: string | null;
  visibilityRule?: string | null;
};

export function computeVisibleFieldsWithCalculations<T extends FieldLike>(
  fields: T[],
  data: FormDataMap
): { visible: T[]; enrichedData: FormDataMap } {
  const enrichedData = { ...data };
  // calculated fields resolve first so downstream visibility rules can reference them
  for (const f of fields) {
    if (f.type === "CALCULATED" && f.formula) {
      const value = evaluateFormula(f.formula, enrichedData);
      if (value !== null) enrichedData[f.key] = value;
    }
  }
  const visible = fields.filter((f) => isFieldVisible(f.visibilityRule, enrichedData));
  return { visible, enrichedData };
}
