"use client";

import { useState } from "react";
import type { Product } from "@/lib/catalog";
import type { Dictionary } from "@/lib/i18n";
import { assessDate, noticeDays } from "@/lib/orderRules";
import { productMessage, waLink } from "@/lib/whatsapp";
import AskChips from "./AskChips";
import DateCheck from "./DateCheck";
import PriceLabel from "./PriceLabel";
import WhatsAppButton from "./WhatsAppButton";

/**
 * The ordering part of a garland page: the event date check and both Order on WhatsApp buttons
 * (a wide one in the page, a bar that stays at the bottom on phones). A chosen date goes into the message.
 */
export default function GarlandOrder({ product, t }: { product: Product; t: Dictionary }) {
  const [date, setDate] = useState("");
  const days = noticeDays(product.occasions, product.types);
  const chosen = { ymd: date, status: assessDate(date, days) };
  const href = waLink(productMessage(product, chosen));

  return (
    <>
      <div className="mt-6 rounded-2xl border border-line bg-white p-4">
        <DateCheck id="event-date" t={t} days={days} value={date} onChange={setDate} title={t.dateTitle} />
      </div>

      <div className="mt-6 hidden md:block">
        <WhatsAppButton href={href} size="lg" full track={product.id}>
          {t.orderWhatsApp}
        </WhatsAppButton>
      </div>

      <AskChips product={product} t={t} date={chosen} />

      {/* Order bar that stays on screen on phones */}
      <div className="order-bar fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <PriceLabel t={t} price={product.price} maxPrice={product.maxPrice} className="shrink-0 text-sm text-rose-deep" />
          <WhatsAppButton href={href} full className="flex-1" track={product.id}>
            {t.orderWhatsApp}
          </WhatsAppButton>
        </div>
      </div>
    </>
  );
}
