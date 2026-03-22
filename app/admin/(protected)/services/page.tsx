import { ServicesManager } from "@/components/admin/ServicesManager";
import { requireEditorPage } from "@/src/lib/auth/require-page-role";
import { listServices } from "@/src/lib/domain/services";

export default async function AdminServicesPage() {
  const { supabase } = await requireEditorPage();
  const data = await listServices({ includeUnpublished: true }, supabase);
  return <ServicesManager initialServices={data} />;
}
