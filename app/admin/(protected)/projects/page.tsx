import { ProjectsManager } from "@/components/admin/ProjectsManager";
import { requireEditorPage } from "@/src/lib/auth/require-page-role";
import { listProjects } from "@/src/lib/domain/projects";

export default async function AdminProjectsPage() {
  const { supabase } = await requireEditorPage();
  const data = await listProjects({ includeUnpublished: true, includeMedia: false }, supabase);

  return <ProjectsManager initialProjects={data} />;
}
