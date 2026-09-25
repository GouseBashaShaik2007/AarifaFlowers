// Google Search Console proof of ownership.
//
// The same file also sits in public/, which answers at the root of the site. This copy answers under a language
// as well (/en/…, /hi/… and the rest), because Search Console asks for the file under whichever address the
// property was created with. Keep both for as long as the site is verified: removing them undoes the proof.

import { LANGS } from "@/lib/catalog";

export const dynamic = "force-static";
export const generateStaticParams = () => LANGS.map((lang) => ({ lang }));

const PROOF = "google-site-verification: google196aeeb657e8647b.html\n";

export function GET() {
  return new Response(PROOF, { headers: { "content-type": "text/html; charset=utf-8" } });
}
