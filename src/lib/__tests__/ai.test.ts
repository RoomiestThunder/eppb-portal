import { describe, it, expect } from "vitest";
import {
  recommendServices,
  answerFaq,
  explainServiceSimply,
  checkApplicationCompleteness,
  suggestServiceStructure,
  prepareForExternalLlm,
  type ServiceForAi,
} from "@/lib/ai";

// These functions back the client chat widget, the "Проверить с помощью AI" button, and the
// author-facing structure suggestion — none of them touch the network, so a real LLM outage in
// production could never take down the AI helpers this MVP actually ships (see the fallback
// invariant documented at the top of src/lib/ai.ts). These tests lock in that they're pure and
// deterministic, which is what makes that guarantee true rather than accidental.

const services: ServiceForAi[] = [
  { id: "1", slug: "wagon-leasing", name: "Приобретение вагонов в лизинг", shortDescription: "Финансовый лизинг грузовых вагонов", category: "Лизинг", tags: "лизинг,вагоны,логистика" },
  { id: "2", slug: "agro-livestock", name: "Субсидирование животноводства", shortDescription: "Возмещение затрат на скот", category: "Субсидирование", tags: "субсидии,агробизнес,животноводство" },
];

describe("recommendServices", () => {
  it("ranks the service whose tags/name match the query highest", () => {
    const results = recommendServices("хочу купить вагоны в лизинг", services);
    expect(results[0].service.slug).toBe("wagon-leasing");
  });

  it("returns nothing for a query with no matching tokens", () => {
    expect(recommendServices("совершенно не по теме xyz123", services)).toHaveLength(0);
  });

  it("returns nothing for an empty query instead of throwing", () => {
    expect(recommendServices("", services)).toEqual([]);
  });
});

describe("answerFaq", () => {
  it("matches a known topic", () => {
    expect(answerFaq("что такое БИН?")).toContain("БИН");
  });

  it("returns null for an unrecognized question", () => {
    expect(answerFaq("какая погода в Астане")).toBeNull();
  });
});

describe("explainServiceSimply", () => {
  it("mentions the service name and category", () => {
    const text = explainServiceSimply(services[0]);
    expect(text).toContain("Приобретение вагонов в лизинг");
    expect(text).toContain("Лизинг");
  });
});

describe("checkApplicationCompleteness", () => {
  const fields = [
    { key: "applicant_bin", label: "БИН", required: true, type: "TEXT" },
    { key: "wagon_count", label: "Количество вагонов", required: true, type: "NUMBER" },
    { key: "comment", label: "Комментарий", required: false, type: "TEXTAREA" },
  ];

  it("flags missing required fields", () => {
    const issues = checkApplicationCompleteness(fields, { applicant_bin: "900000000000" });
    expect(issues.map((i) => i.fieldKey)).toEqual(["wagon_count"]);
  });

  it("flags a non-numeric value in a NUMBER field", () => {
    const issues = checkApplicationCompleteness(fields, { applicant_bin: "x", wagon_count: "not-a-number" });
    expect(issues.some((i) => i.fieldKey === "wagon_count")).toBe(true);
  });

  it("passes when every required field is present and valid", () => {
    expect(checkApplicationCompleteness(fields, { applicant_bin: "x", wagon_count: 5 })).toHaveLength(0);
  });
});

describe("suggestServiceStructure", () => {
  it("matches the leasing template on a relevant keyword", () => {
    expect(suggestServiceStructure("лизинг сельхозтехники для фермеров").category).toBe("Лизинг");
  });

  it("matches the subsidy template", () => {
    expect(suggestServiceStructure("субсидия на развитие бизнеса").category).toBe("Субсидирование");
  });

  it("falls back to a generic draft when nothing matches", () => {
    const draft = suggestServiceStructure("что-то совсем другое");
    expect(draft.category).toBe("Другое");
    expect(draft.steps.length).toBeGreaterThan(0);
  });
});

describe("prepareForExternalLlm", () => {
  it("masks known-sensitive keys before any hypothetical external call", () => {
    const masked = prepareForExternalLlm({ applicant_bin: "900000000000", wagon_count: 15 });
    expect(masked.applicant_bin).toBe("********0000");
    expect(masked.wagon_count).toBe(15);
  });
});
