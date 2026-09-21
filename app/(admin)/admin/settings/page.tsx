import SettingsForm from "@/components/admin/SettingsForm";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_SETTINGS } from "@/lib/content";
import { getSiteSettings } from "@/lib/siteContent";

export default async function SettingsPage() {
  await requireAdmin();
  const initial = await getSiteSettings();
  return <SettingsForm initial={initial} defaults={DEFAULT_SETTINGS} />;
}
