import { QuoteRequestsManager } from "@/components/admin/QuoteRequestsManager";
import { listQuoteRequests } from "@/src/lib/domain/quote-requests";
import { requireEditorPage } from "@/src/lib/auth/require-page-role";

export default async function AdminQuoteRequestsPage() {
  const { supabase } = await requireEditorPage();
  const initialItems = await listQuoteRequests({ limit: 250 }, supabase);

  return <QuoteRequestsManager initialItems={initialItems} />;
}

