"use client";

import type { Product } from "@/lib/catalog";
import type { Dictionary } from "@/lib/i18n";
import type { DateStatus } from "@/lib/orderRules";
import { type AskKind, askMessage, waLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "./icons";
import { trackTap } from "./track";

/**
 * Three short questions for a visitor who likes a garland but is not ready to order.
 * They open the same chat as the green button, with a different question already written.
 * They are quiet outlines on purpose, so the green Order button stays the one thing that stands out.
 */
export default function AskChips({
  product,
  t,
  date,
}: {
  product: Product;
  t: Dictionary;
  date?: { ymd: string; status: DateStatus | null };
}) {
  const asks: { kind: AskKind; label: string }[] = [
    { kind: "price", label: t.askPrice },
    { kind: "date", label: t.askDate },
    { kind: "delivery", label: t.askDelivery },
  ];

  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-muted">{t.askTitle}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {asks.map((a) => (
          <li key={a.kind}>
            <a
              href={waLink(askMessage(product, a.kind, a.kind === "date" ? date : undefined))}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackTap(product.id)}
              onAuxClick={() => trackTap(product.id)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-wa/40 bg-white px-3.5 text-sm font-medium text-wa-deep transition hover:border-wa hover:bg-wa/5 active:scale-[0.98]"
            >
              <WhatsAppIcon className="h-4 w-4" />
              {a.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
