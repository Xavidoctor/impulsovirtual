import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireAdminApi, requireEditorApi } from "@/src/lib/auth/require-api-role";
import { writeAuditLog } from "@/src/lib/cms/audit";
import {
  createOrUpdateCmsAsset,
  deleteCmsAssetById,
  getCmsAssetById,
  getProjectMediaByPublicUrl,
  getProjectMediaByStorageKey,
  listCmsAssets,
} from "@/src/lib/cms/queries";
import { getR2Config } from "@/src/lib/r2/client";
import { deleteFromR2 } from "@/src/lib/r2/presign";
import {
  assetCommitSchema,
  assetDeleteSchema,
  assetListQuerySchema,
} from "@/src/lib/validators/assets-schema";

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

function inferFilename(storageKey: string, publicUrl: string) {
  const fromStorage = storageKey.split("/").pop()?.trim();
  if (fromStorage) return fromStorage;

  try {
    const parsed = new URL(publicUrl);
    const fromUrl = parsed.pathname.split("/").pop()?.trim();
    if (fromUrl) return fromUrl;
  } catch {
    // Ignore invalid URL and fallback.
  }

  return "asset";
}

async function hydrateCmsAssetsFromProjectMedia(params: {
  supabase: Parameters<typeof listCmsAssets>[0];
  userId: string;
}) {
  const { data: projectMedia, error: mediaError } = await params.supabase
    .from("project_media")
    .select("kind, storage_key, public_url, alt_text, width, height, duration_seconds")
    .order("created_at", { ascending: false })
    .limit(800);

  if (mediaError || !projectMedia?.length) {
    if (mediaError) {
      console.error("project_media hydration read failed", mediaError.message);
    }
    return;
  }

  const uniqueByPublicUrl = new Map<string, (typeof projectMedia)[number]>();
  projectMedia.forEach((item) => {
    if (!uniqueByPublicUrl.has(item.public_url)) {
      uniqueByPublicUrl.set(item.public_url, item);
    }
  });

  const rows = Array.from(uniqueByPublicUrl.values()).map((item) => ({
    filename: inferFilename(item.storage_key, item.public_url),
    kind: item.kind,
    storage_key: item.storage_key,
    public_url: item.public_url,
    content_type: inferMimeTypeFromPublicUrl(item.kind, item.public_url),
    file_size: null,
    width: item.width ?? null,
    height: item.height ?? null,
    duration_seconds: item.duration_seconds ?? null,
    alt_text: item.alt_text ?? null,
    tags: [],
    created_by: params.userId,
  }));

  if (!rows.length) return;

  const { error: upsertError } = await params.supabase
    .from("cms_assets")
    .upsert(rows, { onConflict: "public_url", ignoreDuplicates: true });

  if (upsertError) {
    console.error("cms_assets hydration upsert failed", upsertError.message);
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  const query = assetListQuerySchema.parse({
    search: request.nextUrl.searchParams.get("search") ?? undefined,
    kind: request.nextUrl.searchParams.get("kind") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
  });

  await hydrateCmsAssetsFromProjectMedia({
    supabase: auth.context.supabase,
    userId: auth.context.userId,
  });

  const { data, error } = await listCmsAssets(auth.context.supabase, query);
  if (error) {
    return NextResponse.json(
      { error: "No se pudo cargar la biblioteca de recursos." },
      { status: 400 },
    );
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = assetCommitSchema.parse(await request.json());
    const { supabase, userId } = auth.context;

    let publicBaseUrl = "";
    try {
      publicBaseUrl = getR2Config().publicBaseUrl;
    } catch {
      publicBaseUrl = "";
    }

    if (!publicBaseUrl) {
      return NextResponse.json(
        { error: "R2 no está configurado para registrar recursos." },
        { status: 400 },
      );
    }

    if (!payload.publicUrl.startsWith(`${publicBaseUrl}/`)) {
      return NextResponse.json(
        { error: "La URL pública no coincide con el dominio de media configurado." },
        { status: 422 },
      );
    }

    const { data, error } = await createOrUpdateCmsAsset(supabase, {
      filename: payload.filename,
      kind: payload.kind,
      storage_key: payload.storageKey,
      public_url: payload.publicUrl,
      content_type: payload.contentType,
      file_size: payload.fileSize ?? null,
      width: payload.width ?? null,
      height: payload.height ?? null,
      duration_seconds: payload.durationSeconds ?? null,
      alt_text: payload.altText ?? null,
      tags: payload.tags ?? [],
      created_by: userId,
    });

    if (error) {
      return NextResponse.json(
        { error: "No se pudo registrar el recurso en la biblioteca." },
        { status: 400 },
      );
    }

    await writeAuditLog(supabase, {
      actor_id: userId,
      action: "asset.library.upserted",
      entity_type: "cms_asset",
      entity_id: data.id,
      before_json: null,
      after_json: data,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos de recurso no válidos.", details: error.flatten() },
        { status: 422 },
      );
    }

    return NextResponse.json(
      { error: "Error interno al registrar el recurso." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = assetDeleteSchema.parse(await request.json());
    const { supabase, userId } = auth.context;

    const { data: asset, error: loadError } = await getCmsAssetById(supabase, payload.id);
    if (loadError) {
      return NextResponse.json(
        { error: "No se pudo cargar el recurso para eliminarlo." },
        { status: 400 },
      );
    }

    if (!asset) {
      return NextResponse.json({ error: "Recurso no encontrado." }, { status: 404 });
    }

    const [{ data: byStorage }, { data: byUrl }] = await Promise.all([
      getProjectMediaByStorageKey(supabase, asset.storage_key),
      getProjectMediaByPublicUrl(supabase, asset.public_url),
    ]);

    if (byStorage || (byUrl?.length ?? 0) > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar este recurso porque está en uso en proyectos." },
        { status: 409 },
      );
    }

    if (!asset.storage_key.startsWith("manual/") && !asset.storage_key.startsWith("legacy/")) {
      try {
        await deleteFromR2(asset.storage_key);
      } catch {
        return NextResponse.json(
          { error: "No se pudo eliminar el archivo en R2." },
          { status: 500 },
        );
      }
    }

    const { error: deleteError } = await deleteCmsAssetById(supabase, asset.id);
    if (deleteError) {
      return NextResponse.json(
        { error: "No se pudo eliminar el recurso de la biblioteca." },
        { status: 400 },
      );
    }

    await writeAuditLog(supabase, {
      actor_id: userId,
      action: "asset.library.deleted",
      entity_type: "cms_asset",
      entity_id: asset.id,
      before_json: asset,
      after_json: null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Solicitud de eliminación no válida.", details: error.flatten() },
        { status: 422 },
      );
    }

    return NextResponse.json(
      { error: "Error interno al eliminar el recurso." },
      { status: 500 },
    );
  }
}
