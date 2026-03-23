import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireEditorApi } from "@/src/lib/auth/require-api-role";
import { writeAuditLog } from "@/src/lib/cms/audit";
import { createOrUpdateCmsAsset } from "@/src/lib/domain/media-library";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { STORAGE_BUCKETS, type StorageBucketName } from "@/src/lib/storage/buckets";
import { assetPresignSchema, assetScopeSchema } from "@/src/lib/validators/assets-schema";
import { buildCmsAssetStorageKey } from "@/src/lib/r2/keys";

function resolveBucketForScope(scope: string): StorageBucketName {
  if (scope === "project") return STORAGE_BUCKETS.projectMedia;
  if (scope === "blog") return STORAGE_BUCKETS.blogCovers;
  if (scope === "brand") return STORAGE_BUCKETS.brandAssets;
  if (scope === "proposals") return STORAGE_BUCKETS.proposalFiles;
  return STORAGE_BUCKETS.siteMedia;
}

function resolveLogicalCollection(scope: string) {
  if (scope === "project") return "projects";
  if (scope === "blog") return "blog";
  if (scope === "brand") return "brand";
  if (scope === "proposals") return "proposals";
  return "site";
}

function parseNumber(value: FormDataEntryValue | null | undefined) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

export async function POST(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    console.warn("[upload][assets/upload] auth:error");
    return auth.response;
  }

  try {
    const formData = await request.formData();
    const fileEntry = formData.get("file");
    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ error: "Archivo no válido." }, { status: 422 });
    }

    const scope = assetScopeSchema.parse((formData.get("scope") as string | null) ?? "general");
    const contentType = ((formData.get("contentType") as string | null) ?? fileEntry.type).trim();
    const payload = assetPresignSchema.parse({
      filename: fileEntry.name,
      contentType,
      kind: formData.get("kind"),
      fileSizeBytes: fileEntry.size,
      scope,
      pageKey: (formData.get("pageKey") as string | null) ?? undefined,
      sectionKey: (formData.get("sectionKey") as string | null) ?? undefined,
      settingKey: (formData.get("settingKey") as string | null) ?? undefined,
      folder: (formData.get("folder") as string | null) ?? undefined,
    });

    console.info("[upload][assets/upload] request", {
      userId: auth.context.userId,
      filename: payload.filename,
      kind: payload.kind,
      contentType: payload.contentType,
      fileSizeBytes: payload.fileSizeBytes,
      scope: payload.scope,
    });

    const bucket = resolveBucketForScope(payload.scope);
    const objectKey = buildCmsAssetStorageKey({
      filename: payload.filename,
      kind: payload.kind,
      scope: payload.scope,
      pageKey: payload.pageKey,
      sectionKey: payload.sectionKey,
      settingKey: payload.settingKey,
      folder: payload.folder,
    });
    const metadataStorageKey = `supabase/${bucket}/${objectKey}`;

    const admin = createSupabaseAdminClient();
    const fileBuffer = Buffer.from(await fileEntry.arrayBuffer());

    console.info("[upload][assets/upload] upload:start", {
      bucket,
      objectKey,
      contentType: payload.contentType,
    });

    const { error: uploadError } = await admin.storage.from(bucket).upload(objectKey, fileBuffer, {
      contentType: payload.contentType,
      upsert: false,
    });

    if (uploadError) {
      console.error("[upload][assets/upload] upload:error", {
        message: uploadError.message,
        bucket,
        objectKey,
      });
      return NextResponse.json(
        { error: `No se pudo subir el archivo a Supabase Storage: ${uploadError.message}` },
        { status: 400 },
      );
    }

    const { data: publicData } = admin.storage.from(bucket).getPublicUrl(objectKey);
    const publicUrl = publicData.publicUrl;

    const width = parseNumber(formData.get("width"));
    const height = parseNumber(formData.get("height"));
    const durationSeconds = parseNumber(formData.get("durationSeconds"));
    const fileSize = parseNumber(formData.get("fileSize")) ?? payload.fileSizeBytes;

    const savedAsset = await createOrUpdateCmsAsset(
      {
        logical_collection: resolveLogicalCollection(payload.scope),
        storage_provider: "supabase",
        bucket_name: bucket,
        filename: payload.filename,
        kind: payload.kind,
        storage_key: metadataStorageKey,
        public_url: publicUrl,
        content_type: payload.contentType,
        file_size: fileSize,
        width: width ?? null,
        height: height ?? null,
        duration_seconds: durationSeconds ?? null,
        alt_text: null,
        caption: null,
        tags: [],
        created_by: auth.context.userId,
      },
      auth.context.supabase,
    );

    if (!savedAsset) {
      console.error("[upload][assets/upload] commit:error", {
        storageKey: metadataStorageKey,
      });
      return NextResponse.json(
        { error: "No se pudo registrar el recurso en la biblioteca." },
        { status: 400 },
      );
    }

    await writeAuditLog(auth.context.supabase, {
      actor_id: auth.context.userId,
      action: "asset.upload.supabase",
      entity_type: "cms_asset",
      entity_id: savedAsset.id,
      before_json: null,
      after_json: savedAsset,
    });

    console.info("[upload][assets/upload] success", {
      assetId: savedAsset.id,
      storageKey: savedAsset.storage_key,
    });

    return NextResponse.json({ data: savedAsset }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      console.warn("[upload][assets/upload] validation:error", {
        details: error.flatten(),
      });
      return NextResponse.json(
        { error: "Datos de subida no válidos.", details: error.flatten() },
        { status: 422 },
      );
    }

    console.error("[upload][assets/upload] internal:error", error);
    return NextResponse.json(
      { error: "Error interno al subir el recurso." },
      { status: 500 },
    );
  }
}

