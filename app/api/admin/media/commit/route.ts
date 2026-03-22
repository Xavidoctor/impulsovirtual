import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireEditorApi } from "@/src/lib/auth/require-api-role";
import { writeAuditLog } from "@/src/lib/cms/audit";
import {
  createOrUpdateCmsAsset,
  createProjectMedia,
} from "@/src/lib/domain/media-library";
import {
  inferAssetBucketName,
  inferAssetCollectionFromStorageKey,
  inferAssetStorageProvider,
} from "@/src/lib/media/cms-assets";
import { getProjectById } from "@/src/lib/domain/projects";
import { getR2Config } from "@/src/lib/r2/client";
import { buildDeterministicMediaStorageKey } from "@/src/lib/r2/keys";
import { mediaCommitSchema } from "@/src/lib/validators/media-schema";

function inferMimeTypeFromPublicUrl(kind: "image" | "video", publicUrl: string) {
  const lower = publicUrl.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".avif")) return "image/avif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  return kind === "image" ? "image/jpeg" : "video/mp4";
}

function inferFilenameFromStorageKey(storageKey: string) {
  const segments = storageKey.split("/");
  return segments[segments.length - 1] ?? storageKey;
}

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

    const project = await getProjectById(payload.projectId, undefined, supabase);
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

    const data = await createProjectMedia(
      {
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
      },
      supabase,
    );

    if (!data) {
      return NextResponse.json({ error: "No se pudo registrar el recurso del proyecto." }, { status: 400 });
    }

    if (!isManual) {
      const assetPayload = {
        logical_collection: inferAssetCollectionFromStorageKey(storageKey),
        storage_provider: inferAssetStorageProvider(storageKey, payload.publicUrl),
        bucket_name: inferAssetBucketName(
          inferAssetStorageProvider(storageKey, payload.publicUrl),
        ),
        filename: inferFilenameFromStorageKey(storageKey),
        kind: payload.kind,
        storage_key: storageKey,
        public_url: payload.publicUrl,
        content_type: inferMimeTypeFromPublicUrl(payload.kind, payload.publicUrl),
        file_size: null,
        width: payload.width ?? null,
        height: payload.height ?? null,
        duration_seconds: payload.durationSeconds ?? null,
        alt_text: payload.altText ?? null,
        caption: payload.caption ?? null,
        tags: [],
        created_by: userId,
      };
      const asset = await createOrUpdateCmsAsset(assetPayload, supabase);
      if (!asset) {
        console.error("cms_assets upsert failed");
      }
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
