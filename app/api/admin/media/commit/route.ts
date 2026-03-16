import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireEditorApi } from "@/src/lib/auth/require-api-role";
import { writeAuditLog } from "@/src/lib/cms/audit";
import { createProjectMedia, getProjectById } from "@/src/lib/cms/queries";
import { getR2Config } from "@/src/lib/r2/client";
import { buildDeterministicMediaStorageKey } from "@/src/lib/r2/keys";
import { mediaCommitSchema } from "@/src/lib/validators/media-schema";

export async function POST(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = mediaCommitSchema.parse(await request.json());
    const { supabase, userId } = auth.context;
    let publicBaseUrl = "";
    try {
      publicBaseUrl = getR2Config().publicBaseUrl;
    } catch {
      publicBaseUrl = "";
    }

    const { data: project } = await getProjectById(supabase, payload.projectId);
    if (!project) {
      return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
    }

    const isManual = payload.sourceType === "manual";
    let storageKey = payload.storageKey;

    if (isManual) {
      storageKey = buildDeterministicMediaStorageKey({
        scope: "manual",
        projectRef: project.slug,
        role: payload.role,
        kind: payload.kind,
        source: payload.publicUrl,
      });
    } else {
      if (!publicBaseUrl) {
        return NextResponse.json(
          { error: "R2 no está configurado. Usa el modo de recursos manual por ahora." },
          { status: 400 },
        );
      }

      if (!payload.publicUrl.startsWith(`${publicBaseUrl}/`)) {
        return NextResponse.json(
          { error: "publicUrl debe pertenecer a la URL base de R2 configurada." },
          { status: 422 },
        );
      }
    }

    if (!storageKey) {
      return NextResponse.json(
        { error: "storageKey es obligatorio para sourceType = r2." },
        { status: 422 },
      );
    }

    const { data, error } = await createProjectMedia(supabase, {
      project_id: payload.projectId,
      kind: payload.kind,
      role: payload.role,
      storage_key: storageKey,
      public_url: payload.publicUrl,
      alt_text: payload.altText ?? null,
      caption: payload.caption ?? null,
      width: payload.width ?? null,
      height: payload.height ?? null,
      duration_seconds: payload.durationSeconds ?? null,
      sort_order: payload.sortOrder,
    });

    if (error) {
      return NextResponse.json({ error: "No se pudo registrar el recurso del proyecto." }, { status: 400 });
    }

    await writeAuditLog(supabase, {
      actor_id: userId,
      action: "media.committed",
      entity_type: "project_media",
      entity_id: data.id,
      before_json: null,
      after_json: data,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Payload de registro de recursos no válido.", details: error.flatten() },
        { status: 422 },
      );
    }

    void error;
    return NextResponse.json({ error: "Error interno al registrar el recurso." }, { status: 500 });
  }
}
