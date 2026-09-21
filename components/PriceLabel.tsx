import type { Dictionary } from "@/lib/i18n";
import { formatPrice } from "@/lib/whatsapp";

/** "From ₹1,499" in the visitor's language. The number stays left to right inside right to left text. */
export default function PriceLabel({ t, price, className = "" }: { t: Dictionary; price: number; className?: string }) {
  const [before, after] = t.fromPrice.split("{price}");
  return (
    <span className={className}>
      {before}
      <bdi className="font-semibold">{formatPrice(price)}</bdi>
      {after}
    </span>
  );
}
