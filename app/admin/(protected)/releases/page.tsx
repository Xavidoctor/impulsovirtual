import { ReleasesManager } from "@/components/admin/ReleasesManager";
import { listReleases } from "@/src/lib/cms/queries";
import { requireEditorPage } from "@/src/lib/auth/require-page-role";

export default async function AdminReleasesPage() {
  const { supabase, profile } = await requireEditorPage();
  const { data } = await listReleases(supabase);

  return (
    <ReleasesManager
      initialReleases={data ?? []}
      isAdmin={profile.role === "admin"}
    />
  );
}
