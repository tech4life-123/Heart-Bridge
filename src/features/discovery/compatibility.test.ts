import { describe, expect, it } from "vitest";
import {
  rankByCompatibility,
  scoreCompatibility,
  type ScoringCandidate,
  type ScoringSubject,
} from "./compatibility";

const viewer: ScoringSubject = {
  intentionPrimary: "serious_relationship",
  intentionsExtra: [],
  interestIds: ["music", "football", "cooking"],
  smoking: "never",
  drinking: "sometimes",
  childrenPreference: "want_children",
  languages: ["English", "Kpelle"],
};

const candidate = (over: Partial<ScoringCandidate> = {}): ScoringCandidate => ({
  intentionPrimary: "serious_relationship",
  intentionsExtra: [],
  interestIds: ["music", "football", "cooking"],
  smoking: "never",
  drinking: "sometimes",
  childrenPreference: "want_children",
  languages: ["English"],
  proximity: 3,
  qaSimilarity: 1,
  qaCount: 4,
  ...over,
});

const labels = new Map([
  ["music", "Music"],
  ["football", "Football"],
  ["cooking", "Cooking"],
]);

describe("scoreCompatibility", () => {
  it("gives a perfect match 100 and explains why", () => {
    const r = scoreCompatibility(viewer, candidate(), labels);
    expect(r.score).toBe(100);
    expect(r.comparedFactors).toBe(7);
    expect(r.reasons).toHaveLength(3);
    expect(r.reasons.join(" ")).toMatch(/serious relationship/);
  });

  it("never lets missing information lower the score", () => {
    const sparse = candidate({
      interestIds: [],
      smoking: null,
      drinking: null,
      childrenPreference: null,
      languages: [],
      qaSimilarity: null,
      qaCount: 0,
    });
    const r = scoreCompatibility(viewer, sparse, labels);
    // Only intention (match) and location (same city) can be compared -> still 100.
    expect(r.comparedFactors).toBe(2);
    expect(r.score).toBe(100);
  });

  it("scores clearly different goals low", () => {
    const r = scoreCompatibility(viewer, candidate({ intentionPrimary: "friendship", proximity: 0, qaSimilarity: 0.1 }), labels);
    expect(r.score).not.toBeNull();
    expect(r.score!).toBeLessThan(60);
  });

  it("treats shared secondary intentions as partial agreement", () => {
    const r = scoreCompatibility(
      viewer,
      candidate({ intentionPrimary: "dating", intentionsExtra: ["serious_relationship"] }),
      labels,
    );
    expect(r.factors.find((f) => f.key === "intention")?.value).toBe(0.8);
  });

  it("recognises long-term vs casual groups", () => {
    const longTerm = scoreCompatibility(viewer, candidate({ intentionPrimary: "marriage" }), labels);
    expect(longTerm.factors.find((f) => f.key === "intention")?.value).toBe(0.5);
    const casual = scoreCompatibility(
      { ...viewer, intentionPrimary: "dating" },
      candidate({ intentionPrimary: "getting_to_know" }),
      labels,
    );
    expect(casual.factors.find((f) => f.key === "intention")?.value).toBe(0.5);
  });

  it("caps interest credit at three shared interests", () => {
    const some = scoreCompatibility(viewer, candidate({ interestIds: ["music"] }), labels);
    expect(some.factors.find((f) => f.key === "interests")?.value).toBeCloseTo(1 / 3);
    const many = scoreCompatibility(viewer, candidate(), labels);
    expect(many.factors.find((f) => f.key === "interests")?.value).toBe(1);
    expect(many.reasons.join(" ")).toMatch(/music, football and cooking|enjoy/);
  });

  it("handles children and lifestyle comparisons, ignoring 'prefer not to say'", () => {
    const hidden = scoreCompatibility(
      viewer,
      candidate({ childrenPreference: "prefer_not_to_say", smoking: "prefer_not_to_say", drinking: "prefer_not_to_say" }),
      labels,
    );
    expect(hidden.factors.find((f) => f.key === "children")).toBeUndefined();
    expect(hidden.factors.find((f) => f.key === "lifestyle")).toBeUndefined();

    const clash = scoreCompatibility(viewer, candidate({ childrenPreference: "no_children" }), labels);
    expect(clash.factors.find((f) => f.key === "children")?.value).toBe(0);
    const open = scoreCompatibility(viewer, candidate({ childrenPreference: "open_to_children" }), labels);
    expect(open.factors.find((f) => f.key === "children")?.value).toBe(0.8);
  });

  it("only uses the questionnaire when at least two answers overlap", () => {
    const one = scoreCompatibility(viewer, candidate({ qaCount: 1, qaSimilarity: 1 }), labels);
    expect(one.factors.find((f) => f.key === "questions")).toBeUndefined();
    const two = scoreCompatibility(viewer, candidate({ qaCount: 2, qaSimilarity: 0.5 }), labels);
    expect(two.factors.find((f) => f.key === "questions")?.value).toBe(0.5);
  });

  it("scores distance without erasing diaspora connections", () => {
    const far = scoreCompatibility(viewer, candidate({ proximity: 0 }), labels);
    expect(far.factors.find((f) => f.key === "location")?.value).toBe(0.2);
    expect(far.score).toBeGreaterThan(70);
  });

  it("returns a null score when too little can be compared", () => {
    const noIntent = scoreCompatibility({ ...viewer, intentionPrimary: null }, candidate({
      interestIds: [], smoking: null, drinking: null, childrenPreference: null, languages: [], qaSimilarity: null, qaCount: 0,
    }), labels);
    expect(noIntent.score).toBeNull();
  });

  it("never mentions protected attributes in reasons", () => {
    const r = scoreCompatibility(viewer, candidate(), labels);
    expect(r.reasons.join(" ")).not.toMatch(/religio|tribe|ethnic|race|gender|age\b/i);
  });
});

describe("rankByCompatibility", () => {
  const mk = (id: string, score: number | null, proximity: number) => ({
    id,
    proximity,
    compatibility: { score, reasons: [], factors: [], comparedFactors: 0 },
  });

  it("orders by score, then proximity, then original order; unscored last", () => {
    const out = rankByCompatibility([
      mk("a", 70, 1),
      mk("b", null, 3),
      mk("c", 90, 0),
      mk("d", 70, 3),
      mk("e", 70, 3),
    ]);
    expect(out.map((x) => x.id)).toEqual(["c", "d", "e", "a", "b"]);
  });
});
