// Small helpers for what search engines are told about a page.

import { LANGS } from "./catalog";
import { SITE_URL } from "./whatsapp";

/**
 * A page points at itself as the real address and names the same page in the other languages beside it,
 * so a Hindi reader is offered the Hindi page rather than the English one. `path` starts with a slash,
 * or is empty for the home page.
 */
export function langAlternates(lang: string, path = "") {
  return {
    canonical: `${SITE_URL}/${lang}${path}`,
    languages: {
      ...Object.fromEntries(LANGS.map((l) => [l, `${SITE_URL}/${l}${path}`])),
      "x-default": `${SITE_URL}/en${path}`,
    },
  };
}
