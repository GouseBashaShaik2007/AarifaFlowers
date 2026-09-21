import type { Lang } from "./catalog";

/** What the AI sends back for one garland: a name and a short description in every site language. */
export type Suggestion = {
  name: Record<Lang, string>;
  description: Record<Lang, string>;
};
