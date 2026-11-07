import {
  isLivePlant,
  visibleProducts,
  type CareLevel,
  type LightLevel,
  type Product,
} from "@/data/products";

export type QuizAnswers = { light: LightLevel; pets: "safe" | "any"; care: CareLevel };

export const quizQuestions = [
  {
    id: "light",
    title: "How much light does your space get?",
    options: [
      { label: "Low light", value: "low" },
      { label: "Medium, indirect", value: "medium" },
      { label: "Bright and sunny", value: "bright" },
    ],
  },
  {
    id: "pets",
    title: "Do you share your home with pets?",
    options: [
      { label: "Yes, pet-safe only", value: "safe" },
      { label: "No pets", value: "any" },
      { label: "Not a concern", value: "any" },
    ],
  },
  {
    id: "care",
    title: "What’s your care style?",
    options: [
      { label: "Set it and forget it", value: "easy" },
      { label: "A weekly ritual", value: "moderate" },
      { label: "I love a challenge", value: "challenging" },
    ],
  },
] as const;

const LIGHT_ORDER: LightLevel[] = ["low", "medium", "bright"];
const CARE_ORDER: CareLevel[] = ["easy", "moderate", "challenging"];

/** 2 = exact match, 1 = one step away, 0 = further. */
const closeness = <T>(order: readonly T[], a: T, b: T) =>
  Math.max(0, 2 - Math.abs(order.indexOf(a) - order.indexOf(b)));

export type QuizResult = { product: Product; reasons: string[] };

export function recommendPlant(answers: QuizAnswers): QuizResult {
  const candidates = visibleProducts()
    .filter(isLivePlant)
    .filter((p) => (answers.pets === "safe" ? p.petSafe === true : true));

  const scored = candidates
    .map((product) => {
      const light = product.lightLevel
        ? closeness(LIGHT_ORDER, product.lightLevel, answers.light)
        : 0;
      const care = product.careLevel ? closeness(CARE_ORDER, product.careLevel, answers.care) : 0;
      return { product, score: light * 3 + care * 2, light, care };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.product.rating ?? 0) - (a.product.rating ?? 0) ||
        (b.product.reviews ?? 0) - (a.product.reviews ?? 0),
    );

  // The catalog always holds pet-safe plants, but fall back gracefully if that ever changes.
  const best = scored[0] ?? {
    product: visibleProducts().filter(isLivePlant)[0]!,
    light: 0,
    care: 0,
  };

  const reasons: string[] = [];
  if (best.light === 2) reasons.push(`Does well in ${best.product.light.toLowerCase()} light`);
  if (answers.pets === "safe") reasons.push("Safe to have around pets");
  if (best.care === 2)
    reasons.push(
      `Matches your ${answers.care === "easy" ? "low-effort" : answers.care === "moderate" ? "weekly" : "hands-on"} care style`,
    );
  if (reasons.length === 0) reasons.push("The closest fit in our current collection");

  return { product: best.product, reasons };
}
