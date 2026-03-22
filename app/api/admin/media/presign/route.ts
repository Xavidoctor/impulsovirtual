import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireEditorApi } from "@/src/lib/auth/require-api-role";
import { writeAuditLog } from "@/src/lib/cms/audit";
import { getProjectById } from "@/src/lib/domain/projects";
import { buildProjectMediaStorageKey } from "@/src/lib/r2/keys";
import { buildPublicR2Url, createR2PresignedPutUrl } from "@/src/lib/r2/presign";
import { mediaPresignSchema } from "@/src/lib/validators/media-schema";

export async function POST(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = mediaPresignSchema.parse(await request.json());
    let projectSlug: string | undefined;

    if (payload.projectId) {
      const project = await getProjectById(payload.projectId, undefined, auth.context.supabase);
      if (!project) {
        return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
      }
      projectSlug = project.slug;
    }

    const storageKey = buildProjectMediaStorageKey({
      projectSlug,
      projectId: payload.projectId,
      kind: payload.kind,
      filename: payload.filename,
    });

    let uploadUrl = "";
    let publicUrl = "";
    try {
      uploadUrl = await createR2PresignedPutUrl({
        storageKey,
        contentType: payload.contentType,
      });
      publicUrl = buildPublicR2Url(storageKey);
    } catch (presignError) {
      void presignError;
      return NextResponse.json(
        { error: "R2 no está configurado para subida directa." },
        { status: 400 },
      );
    }

    await writeAuditLog(auth.context.supabase, {
      actor_id: auth.context.userId,
      action: "media.presign.created",
      entity_type: "project_media",
      entity_id: storageKey,
      before_json: null,
      after_json: {
        projectId: payload.projectId ?? null,
        kind: payload.kind,
        contentType: payload.contentType,
        storageKey,
      },
    });

    return NextResponse.json({
      uploadUrl,
      storageKey,
      publicUrl,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Payload de firma de subida de recursos no válido.", details: error.flatten() },
        { status: 422 },
      );
    }

    void error;
    return NextResponse.json({ error: "Error interno al generar la firma de subida." }, { status: 500 });
  }
}
