import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireAdminApi } from "@/src/lib/auth/require-api-role";
import { writeAuditLog } from "@/src/lib/cms/audit";
import { rollbackToRelease } from "@/src/lib/cms/rollback";
import { rollbackPayloadSchema } from "@/src/lib/validators/release-schema";

function runRevalidation(slugs: string[]) {
  revalidatePath("/", "page");
  revalidatePath("/works", "page");
  revalidatePath("/works/[slug]", "page");

  const uniqueSlugs = [...new Set(slugs)];
  uniqueSlugs.forEach((slug) => revalidatePath(`/works/${slug}`, "page"));
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = rollbackPayloadSchema.parse(await request.json());
    const result = await rollbackToRelease({
      releaseId: payload.releaseId,
    });

    runRevalidation(result.revalidateSlugs);

    await writeAuditLog(auth.context.supabase, {
      actor_id: auth.context.userId,
      action: "release.rollback",
      entity_type: "release",
      entity_id: result.release.id,
      before_json: null,
      after_json: {
        releaseId: result.release.id,
        restoredSectionCount: result.restoredSectionCount,
        restoredProjectCount: result.restoredProjectCount,
        restoredMediaCount: result.restoredMediaCount,
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Payload de restauración no válido.", details: error.flatten() },
        { status: 422 },
      );
    }

    void error;
    return NextResponse.json({ error: "Error interno al restaurar la versión." }, { status: 500 });
  }
}
