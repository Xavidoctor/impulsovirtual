import { FaqsManager } from "@/components/admin/FaqsManager";
import { requireEditorPage } from "@/src/lib/auth/require-page-role";
import { listFaqs } from "@/src/lib/domain/faqs";

export default async function AdminFaqsPage() {
  const { supabase } = await requireEditorPage();
  const data = await listFaqs({ includeUnpublished: true }, supabase);
  return <FaqsManager initialItems={data} />;
}
