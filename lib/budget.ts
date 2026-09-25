// The price bands behind the budget filter on the garlands list.
// Most visitors know their budget before they know the occasion, so these are the first thing they reach for.

/** A band of prices. The last one has no highest price. */
export type Budget = { id: string; min: number; max?: number };

export const BUDGETS: readonly Budget[] = [
  { id: "1", min: 0, max: 1000 },
  { id: "2", min: 1000, max: 3000 },
  { id: "3", min: 3000 },
];

export const isBudget = (v: string | undefined): boolean => BUDGETS.some((b) => b.id === v);

export const findBudget = (id: string | undefined): Budget | undefined => BUDGETS.find((b) => b.id === id);

/**
 * A garland belongs in a band when any part of its price meets it. A garland priced ₹900 to ₹1,500 shows up
 * under "Under ₹1,000" and under "₹1,000 – ₹3,000", because either is true for somebody's budget.
 */
export function inBudget(band: Budget, price: number, maxPrice?: number): boolean {
  const highest = maxPrice && maxPrice > price ? maxPrice : price;
  return highest >= band.min && (band.max === undefined || price < band.max);
}
