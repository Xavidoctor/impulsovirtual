import { NextResponse } from "next/server";

import { requireEditorApi } from "@/src/lib/auth/require-api-role";
import { listReleases } from "@/src/lib/cms/queries";

export async function GET() {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  const { data, error } = await listReleases(auth.context.supabase);
  if (error) {
    return NextResponse.json({ error: "No se pudieron cargar las publicaciones." }, { status: 400 });
  }

  return NextResponse.json({ data: data ?? [] });
}
