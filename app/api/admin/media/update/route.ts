import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireEditorApi } from "@/src/lib/auth/require-api-role";
import { writeAuditLog } from "@/src/lib/cms/audit";
import {
  getProjectMediaById,
  updateProjectMediaById,
} from "@/src/lib/domain/media-library";
import { mediaUpdateSchema } from "@/src/lib/validators/media-schema";

export async function POST(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = mediaUpdateSchema.parse(await request.json());
    const { supabase, userId } = auth.context;

    const before = await getProjectMediaById(payload.id, supabase);
    if (!before) {
      return NextResponse.json({ error: "Recurso no encontrado." }, { status: 404 });
    }

    const nextRole = payload.role ?? before.role;
    const nextAltText = payload.altText !== undefined ? payload.altText : before.alt_text;

    if ((nextRole === "cover" || nextRole === "hero") && !nextAltText?.trim()) {
      return NextResponse.json(
        { error: "El texto alternativo es obligatorio para portada y principal." },
        { status: 422 },
      );
    }

    const updatePayload: {
      role?: "cover" | "hero" | "gallery" | "detail";
      alt_text?: string | null;
      caption?: string | null;
      sort_order?: number;
    } = {};

    if (payload.role !== undefined) {
      updatePayload.role = payload.role;
    }

    if (payload.altText !== undefined) {
      updatePayload.alt_text = payload.altText ?? null;
    }

    if (payload.caption !== undefined) {
      updatePayload.caption = payload.caption ?? null;
    }

    if (payload.sortOrder !== undefined) {
      updatePayload.sort_order = payload.sortOrder;
    }

    const data = await updateProjectMediaById(payload.id, updatePayload, supabase);
    if (!data) {
      return NextResponse.json(
        { error: "No se pudieron guardar los cambios del recurso." },
        { status: 400 },
      );
    }

    await writeAuditLog(supabase, {
      actor_id: userId,
      action: "media.updated",
      entity_type: "project_media",
      entity_id: data.id,
      before_json: before,
      after_json: data,
    });

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos de actualización de recurso no válidos.", details: error.flatten() },
        { status: 422 },
      );
    }

    void error;
    return NextResponse.json(
      { error: "Error interno al actualizar el recurso." },
      { status: 500 },
    );
  }
}
