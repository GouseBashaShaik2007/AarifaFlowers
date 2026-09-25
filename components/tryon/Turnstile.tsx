"use client";

import { useEffect, useRef } from "react";

// Cloudflare Turnstile: a check that tells people from bots, and only shows itself when it has to.
// It is used only when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set. The server checks the answer with TURNSTILE_SECRET_KEY.

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
export const turnstileOn = Boolean(SITE_KEY);

let scriptReady: Promise<void> | null = null;
function loadScript(): Promise<void> {
  scriptReady ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptReady = null;
      reject(new Error("The security check could not load."));
    };
    document.head.appendChild(script);
  });
  return scriptReady;
}

export default function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const report = useRef(onToken);

  useEffect(() => {
    report.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!SITE_KEY) return;
    let widget: string | undefined;
    let stopped = false;
    loadScript()
      .then(() => {
        if (stopped || !box.current || !window.turnstile) return;
        widget = window.turnstile.render(box.current, {
          sitekey: SITE_KEY,
          appearance: "interaction-only",
          callback: (token: string) => report.current(token),
          "expired-callback": () => report.current(""),
          "error-callback": () => report.current(""),
        });
      })
      .catch(() => report.current(""));
    return () => {
      stopped = true;
      if (widget && window.turnstile) window.turnstile.remove(widget);
    };
  }, []);

  return <div ref={box} />;
}
