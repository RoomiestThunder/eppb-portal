import { describe, it, expect } from "vitest";
import {
  evaluateCondition,
  evaluateFormula,
  isFieldVisible,
  wrapCondition,
  computeVisibleFieldsWithCalculations,
  type ConditionNode,
  type FieldLike,
} from "@/lib/ruleEngine";

describe("evaluateCondition — leaf operators", () => {
  it("eq/neq compare as strings", () => {
    expect(evaluateCondition({ field: "x", op: "eq", value: "5" }, { x: 5 })).toBe(true);
    expect(evaluateCondition({ field: "x", op: "neq", value: "5" }, { x: 5 })).toBe(false);
  });

  it("gt/gte/lt/lte compare as numbers", () => {
    expect(evaluateCondition({ field: "x", op: "gt", value: 10 }, { x: 15 })).toBe(true);
    expect(evaluateCondition({ field: "x", op: "gte", value: 15 }, { x: 15 })).toBe(true);
    expect(evaluateCondition({ field: "x", op: "lt", value: 10 }, { x: 15 })).toBe(false);
    expect(evaluateCondition({ field: "x", op: "lte", value: 15 }, { x: 15 })).toBe(true);
  });

  it("in/notIn check membership", () => {
    expect(evaluateCondition({ field: "x", op: "in", value: ["a", "b"] }, { x: "b" })).toBe(true);
    expect(evaluateCondition({ field: "x", op: "notIn", value: ["a", "b"] }, { x: "c" })).toBe(true);
  });

  it("contains is case-insensitive substring match", () => {
    expect(evaluateCondition({ field: "x", op: "contains", value: "LO" }, { x: "hello" })).toBe(true);
  });

  it("isEmpty/isNotEmpty treat undefined/null/'' as empty", () => {
    expect(evaluateCondition({ field: "x", op: "isEmpty" }, {})).toBe(true);
    expect(evaluateCondition({ field: "x", op: "isEmpty" }, { x: "" })).toBe(true);
    expect(evaluateCondition({ field: "x", op: "isNotEmpty" }, { x: "a" })).toBe(true);
  });
});

describe("evaluateCondition — composite nodes", () => {
  const gt10: ConditionNode = { field: "x", op: "gt", value: 10 };
  const lt20: ConditionNode = { field: "x", op: "lt", value: 20 };

  it("and requires every rule to hold", () => {
    expect(evaluateCondition({ op: "and", rules: [gt10, lt20] }, { x: 15 })).toBe(true);
    expect(evaluateCondition({ op: "and", rules: [gt10, lt20] }, { x: 25 })).toBe(false);
  });

  it("or requires at least one rule to hold", () => {
    expect(evaluateCondition({ op: "or", rules: [gt10, lt20] }, { x: 5 })).toBe(true);
    expect(evaluateCondition({ op: "or", rules: [gt10, lt20] }, { x: 25 })).toBe(true);
  });

  it("not inverts the inner rule", () => {
    expect(evaluateCondition({ op: "not", rule: gt10 }, { x: 5 })).toBe(true);
  });
});

describe("isFieldVisible — DSL versioning", () => {
  it("evaluates a bare legacy condition (no __v envelope)", () => {
    const legacy = JSON.stringify({ field: "wagon_count", op: "gt", value: 10 });
    expect(isFieldVisible(legacy, { wagon_count: 15 })).toBe(true);
    expect(isFieldVisible(legacy, { wagon_count: 5 })).toBe(false);
  });

  it("evaluates the current versioned envelope the same way", () => {
    const versioned = JSON.stringify(wrapCondition({ field: "wagon_count", op: "gt", value: 10 }));
    expect(isFieldVisible(versioned, { wagon_count: 15 })).toBe(true);
    expect(isFieldVisible(versioned, { wagon_count: 5 })).toBe(false);
  });

  it("defaults to visible when there's no rule or it's malformed", () => {
    expect(isFieldVisible(null, {})).toBe(true);
    expect(isFieldVisible("{not json", {})).toBe(true);
  });
});

describe("evaluateFormula", () => {
  it("does arithmetic with field references", () => {
    expect(evaluateFormula("wagon_count * unit_price", { wagon_count: 3, unit_price: 100 })).toBe(300);
  });

  it("respects operator precedence and parentheses", () => {
    expect(evaluateFormula("2 + 3 * 4", {})).toBe(14);
    expect(evaluateFormula("(2 + 3) * 4", {})).toBe(20);
  });

  it("supports round/max/min/abs/sum", () => {
    expect(evaluateFormula("round(10 / 3)", {})).toBe(3);
    expect(evaluateFormula("round(10 / 3, 2)", {})).toBe(3.33);
    expect(evaluateFormula("max(3, 7, 5)", {})).toBe(7);
    expect(evaluateFormula("min(3, 7, 5)", {})).toBe(3);
    expect(evaluateFormula("abs(-8)", {})).toBe(8);
    expect(evaluateFormula("sum(1, 2, 3)", {})).toBe(6);
  });

  it("treats a missing/non-numeric field reference as 0", () => {
    expect(evaluateFormula("missing_field + 5", {})).toBe(5);
  });

  it("chains calculated fields (a formula referencing another formula's output)", () => {
    // Mirrors the real wagon-leasing seed: down_payment_amount feeds monthly_payment.
    const total = evaluateFormula("wagon_count * unit_price", { wagon_count: 15, unit_price: 45_000_000 })!;
    const down = evaluateFormula("round(total_price * down_payment_percent / 100)", { total_price: total, down_payment_percent: 20 })!;
    expect(total).toBe(675_000_000);
    expect(down).toBe(135_000_000);
  });
});

describe("computeVisibleFieldsWithCalculations", () => {
  type F = FieldLike;

  it("resolves CALCULATED fields before applying visibility rules", () => {
    const fields: F[] = [
      { id: "1", key: "count", type: "NUMBER" },
      { id: "2", key: "price", type: "NUMBER" },
      { id: "3", key: "total", type: "CALCULATED", formula: "count * price" },
      {
        id: "4",
        key: "big_order_notice",
        type: "INFO",
        visibilityRule: JSON.stringify(wrapCondition({ field: "total", op: "gt", value: 1000 })),
      },
    ];

    const small = computeVisibleFieldsWithCalculations(fields, { count: 2, price: 100 });
    expect(small.enrichedData.total).toBe(200);
    expect(small.visible.map((f) => f.key)).not.toContain("big_order_notice");

    const big = computeVisibleFieldsWithCalculations(fields, { count: 20, price: 100 });
    expect(big.enrichedData.total).toBe(2000);
    expect(big.visible.map((f) => f.key)).toContain("big_order_notice");
  });
});
