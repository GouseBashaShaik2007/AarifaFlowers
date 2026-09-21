const SUPPORTED = ["en", "hi", "te", "ur"];

// Answers the home address "/" by sending visitors to their language:
// saved choice first, then browser language, then English.
// This is a plain route instead of a Next.js proxy so it also runs on Cloudflare Workers.
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const saved = /(?:^|;\s*)lang=([^;]+)/.exec(request.headers.get("cookie") ?? "")?.[1];
  let lang = saved && SUPPORTED.includes(saved) ? saved : "";

  if (!lang) {
    const header = request.headers.get("accept-language") ?? "";
    for (const part of header.split(",")) {
      const code = part.trim().split(/[-;]/)[0].toLowerCase();
      if (SUPPORTED.includes(code)) {
        lang = code;
        break;
      }
    }
  }

  // A relative address works on any host name, so nothing depends on how the request URL is built.
  return new Response(null, { status: 307, headers: { Location: `/${lang || "en"}` } });
}
