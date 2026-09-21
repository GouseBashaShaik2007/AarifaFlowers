import FaqForm from "@/components/admin/FaqForm";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_FAQ } from "@/lib/faq";
import { getFaq, hasSavedFaq } from "@/lib/siteContent";

export default async function FaqPage() {
  await requireAdmin();
  const [initial, saved] = await Promise.all([getFaq(), hasSavedFaq()]);
  return <FaqForm initial={initial} defaults={DEFAULT_FAQ} neverSaved={!saved} />;
}
