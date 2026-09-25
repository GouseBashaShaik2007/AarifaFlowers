import HeroForm from "@/components/admin/HeroForm";
import { requireAdmin } from "@/lib/auth";
import { getHeroSettings } from "@/lib/siteContent";
import { thumbOf, tr } from "@/lib/catalog";
import { listProducts } from "@/lib/store";

export default async function HeroPage() {
  await requireAdmin();
  const [products, hero] = await Promise.all([listProducts(), getHeroSettings()]);
  const candidates = products
    .filter((p) => p.images[0])
    .map((p) => ({
      id: p.id,
      name: tr(p.name, "en"),
      thumb: thumbOf(p.images[0]),
      image: p.images[0],
      featured: p.featured,
      hasPhoto: true as const,
    }));
  return <HeroForm initial={hero.productIds} candidates={candidates} />;
}
