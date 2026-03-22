import { LeadsManager } from "@/components/admin/LeadsManager";
import { requireEditorPage } from "@/src/lib/auth/require-page-role";
import { listLeads } from "@/src/lib/domain/leads";

export default async function AdminLeadsPage() {
  const { supabase } = await requireEditorPage();
  const data = await listLeads({ limit: 250 }, supabase);

  return <LeadsManager initialLeads={data} />;
}
