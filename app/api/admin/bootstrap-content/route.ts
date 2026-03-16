import { NextResponse } from "next/server";

import { requireAdminApi } from "@/src/lib/auth/require-api-role";
import { writeAuditLog } from "@/src/lib/cms/audit";
import { bootstrapContentFromFrontend } from "@/src/lib/cms/bootstrap-content";

export async function POST() {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const report = await bootstrapContentFromFrontend(auth.context.userId);

    await writeAuditLog(auth.context.supabase, {
      actor_id: auth.context.userId,
      action: "cms.bootstrap_content",
      entity_type: "cms",
      entity_id: "bootstrap",
      before_json: null,
      after_json: report,
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    void error;
    return NextResponse.json({ error: "Error al importar el contenido actual." }, { status: 500 });
  }
}
