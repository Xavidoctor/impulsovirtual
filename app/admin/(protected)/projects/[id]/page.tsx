import { notFound } from "next/navigation";

import { ProjectEditor } from "@/components/admin/ProjectEditor";
import { getProjectById, listProjectMedia } from "@/src/lib/cms/queries";
import { requireEditorPage } from "@/src/lib/auth/require-page-role";

type AdminProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminProjectDetailPage({
  params,
}: AdminProjectDetailPageProps) {
  const { id } = await params;
  const { supabase } = await requireEditorPage();

  const [{ data: project }, { data: media }] = await Promise.all([
    getProjectById(supabase, id),
    listProjectMedia(supabase, id),
  ]);

  if (!project) {
    notFound();
  }

  return <ProjectEditor projectId={id} initialProject={project} initialMedia={media ?? []} />;
}
