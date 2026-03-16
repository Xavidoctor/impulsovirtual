import { SectionsManager } from "@/components/admin/SectionsManager";
import { requireEditorPage } from "@/src/lib/auth/require-page-role";

export default async function AdminSectionsPage() {
  await requireEditorPage();
  return <SectionsManager />;
}
