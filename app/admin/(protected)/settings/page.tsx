import { SettingsManager } from "@/components/admin/SettingsManager";
import { requireEditorPage } from "@/src/lib/auth/require-page-role";

export default async function AdminSettingsPage() {
  const { profile } = await requireEditorPage();
  return <SettingsManager isAdmin={profile.role === "admin"} />;
}
