// Garland data for the public pages. Server only.
//
// Each page view asks the database once, however many parts of the page need the garlands. The page and the layout
// are built at the same moment, so this request runs alongside the one for the site texts, not after it.

import { cache } from "react";
import type { Product } from "./catalog";
import { listProducts } from "./store";

/** Every garland, newest first. Read once per page view. */
export const getProducts = cache((): Promise<Product[]> => listProducts());

/** One garland, found in the list that the page already has. Null when there is no such garland. */
export const getProductById = cache(async (id: string): Promise<Product | null> => {
  return (await getProducts()).find((p) => p.id === id) ?? null;
});
