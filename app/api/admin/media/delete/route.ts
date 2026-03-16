import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireEditorApi } from "@/src/lib/auth/require-api-role";
import { writeAuditLog } from "@/src/lib/cms/audit";
import {
  deleteProjectMediaById,
  getProjectMediaById,
  getProjectMediaByStorageKey,
} from "@/src/lib/cms/queries";
import { deleteFromR2 } from "@/src/lib/r2/presign";
import { mediaDeleteSchema } from "@/src/lib/validators/media-schema";

export async function POST(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = mediaDeleteSchema.parse(await request.json());
    const { supabase, userId } = auth.context;

    const target = payload.id
      ? await getProjectMediaById(supabase, payload.id)
      : await getProjectMediaByStorageKey(supabase, payload.storageKey!);

    const media = target.data;
    if (!media) {
      return NextResponse.json({ error: "Media no encontrada." }, { status: 404 });
    }

    const shouldDeleteInR2 =
      !media.storage_key.startsWith("manual/") && !media.storage_key.startsWith("legacy/");

    if (shouldDeleteInR2) {
      try {
        await deleteFromR2(media.storage_key);
      } catch (r2Error) {
        void r2Error;
        return NextResponse.json(
          { error: "Error al eliminar el objeto en R2." },
          { status: 500 },
        );
      }
    }

    const { error } = await deleteProjectMediaById(supabase, media.id);
    if (error) {
      return NextResponse.json({ error: "No se pudo eliminar el recurso del proyecto." }, { status: 400 });
    }

    await writeAuditLog(supabase, {
      actor_id: userId,
      action: "media.deleted",
      entity_type: "project_media",
      entity_id: media.id,
      before_json: media,
      after_json: null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Payload de eliminación de recursos no válido.", details: error.flatten() },
        { status: 422 },
      );
    }

    void error;
    return NextResponse.json({ error: "Error interno al eliminar el recurso." }, { status: 500 });
  }
}
