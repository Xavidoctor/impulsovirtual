import { TestimonialsManager } from "@/components/admin/TestimonialsManager";
import { requireEditorPage } from "@/src/lib/auth/require-page-role";
import { listTestimonials } from "@/src/lib/domain/testimonials";

export default async function AdminTestimonialsPage() {
  const { supabase } = await requireEditorPage();
  const data = await listTestimonials({ includeUnpublished: true }, supabase);
  return <TestimonialsManager initialItems={data} />;
}
