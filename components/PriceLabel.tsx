import type { Dictionary } from "@/lib/i18n";
import { formatPrice } from "@/lib/whatsapp";

/**
 * "From ₹1,499" in the visitor's language, or "₹1,499 – ₹2,499" when the garland has a price range.
 * The numbers stay left to right inside right to left text.
 */
export default function PriceLabel({
  t,
  price,
  maxPrice,
  className = "",
}: {
  t: Dictionary;
  price: number;
  maxPrice?: number;
  className?: string;
}) {
  if (maxPrice && maxPrice > price) {
    return (
      <span className={className}>
        <bdi className="font-semibold">
          {formatPrice(price)} – {formatPrice(maxPrice)}
        </bdi>
      </span>
    );
  }
  const [before, after] = t.fromPrice.split("{price}");
  return (
    <span className={className}>
      {before}
      <bdi className="font-semibold">{formatPrice(price)}</bdi>
      {after}
    </span>
  );
}
