// Google Search Console proof of ownership, at the root of the site.
//
// This is a route rather than a file in public/, on purpose. Cloudflare serves everything in public/ through its
// static assets, which drop the ".html" ending and redirect (/name.html -> /name). Google asks for the file at the
// exact address it gave, so a redirect fails the check. A route is answered by the site itself and keeps the name.
//
// There is a second copy under each language (app/(site)/[lang]/…), for a property made with a language address.
// Keep both for as long as the site is verified: Google checks again from time to time and would undo it.

// Answered by the site itself on every request, so it can never end up among the static assets and be
// redirected again. It is one tiny line of text, so this costs nothing.
export const dynamic = "force-dynamic";

const PROOF = "google-site-verification: google196aeeb657e8647b.html\n";

export function GET() {
  return new Response(PROOF, { headers: { "content-type": "text/html; charset=utf-8" } });
}
