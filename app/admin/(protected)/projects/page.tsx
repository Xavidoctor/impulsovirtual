import { ProjectsManager } from "@/components/admin/ProjectsManager";
import { listProjects } from "@/src/lib/cms/queries";
import { requireEditorPage } from "@/src/lib/auth/require-page-role";

export default async function AdminProjectsPage() {
  const { supabase } = await requireEditorPage();
  const { data } = await listProjects(supabase);

  return <ProjectsManager initialProjects={data ?? []} />;
}
