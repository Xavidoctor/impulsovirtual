import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireAdminApi } from "@/src/lib/auth/require-api-role";
import { writeAuditLog } from "@/src/lib/cms/audit";
import { publishSnapshotAndContent } from "@/src/lib/cms/publish";
import { publishPayloadSchema } from "@/src/lib/validators/release-schema";

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
    const payload = publishPayloadSchema.parse(await request.json());

    const result = await publishSnapshotAndContent({
      actorId: auth.context.userId,
      label: payload.label,
      notes: payload.notes,
    });

    runRevalidation(result.revalidateSlugs);

    await writeAuditLog(auth.context.supabase, {
      actor_id: auth.context.userId,
      action: "release.publish",
      entity_type: "release",
      entity_id: result.release.id,
      before_json: null,
      after_json: {
        releaseId: result.release.id,
        publishedSectionCount: result.publishedSectionCount,
        publishedProjectCount: result.publishedProjectCount,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Payload de publicación no válido.", details: error.flatten() },
        { status: 422 },
      );
    }

    void error;
    return NextResponse.json({ error: "Error interno al publicar." }, { status: 500 });
  }
}
