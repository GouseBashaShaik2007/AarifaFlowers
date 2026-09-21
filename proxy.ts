import { NextResponse, type NextRequest } from "next/server";

const SUPPORTED = ["en", "hi", "te", "ur"];

/** Sends visitors from "/" to their language: saved choice first, then browser language, then English. */
export function proxy(request: NextRequest) {
  const saved = request.cookies.get("lang")?.value;
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

  return NextResponse.redirect(new URL(`/${lang || "en"}`, request.url));
}

export const config = {
  matcher: "/",
};
