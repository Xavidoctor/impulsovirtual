import { SiteSettingsManager } from "@/components/admin/SiteSettingsManager";
import { requireAdminPage } from "@/src/lib/auth/require-page-role";
import { getAdminPanelSettings, getSiteSettings } from "@/src/lib/domain/settings";

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdminPage();
  const [site, adminPanel] = await Promise.all([
    getSiteSettings(supabase),
    getAdminPanelSettings(supabase),
  ]);

  return <SiteSettingsManager initialSite={site} initialAdminPanel={adminPanel} />;
}
