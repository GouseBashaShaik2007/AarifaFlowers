import InstagramForm from "@/components/admin/InstagramForm";
import { requireAdmin } from "@/lib/auth";
import { getInstagramSettings, hasSavedInstagramSettings } from "@/lib/siteContent";

export default async function InstagramPage() {
  await requireAdmin();
  const [initial, saved] = await Promise.all([getInstagramSettings(), hasSavedInstagramSettings()]);
  return <InstagramForm initial={initial} neverSaved={!saved} />;
}
