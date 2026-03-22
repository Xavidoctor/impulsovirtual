"use client";

import type { Tables } from "@/src/types/database.types";

export type AssetKind = "image" | "video";
export type AssetScope =
  | "project"
  | "section"
  | "setting"
  | "general"
  | "blog"
  | "brand"
  | "site"
  | "proposals";

export const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
]);

export const VIDEO_MIME_TYPES = new Set(["video/mp4", "video/webm"]);
export const VIDEO_MOV_MIME_TYPES = new Set(["video/quicktime", "video/mov"]);

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/svg+xml";
export const VIDEO_ACCEPT = "video/mp4,video/webm";
export const IMAGE_VIDEO_ACCEPT = `${IMAGE_ACCEPT},${VIDEO_ACCEPT}`;

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 350 * 1024 * 1024;

const extensionToMime: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

export function normalizeUploadError(message: string) {
  const text = message.toLowerCase();
  if (text.includes("r2 no está configurado")) return "La subida a R2 no está disponible.";
  if (text.includes("formato") || text.includes("mime")) return "Formato no permitido para esta subida.";
  if (text.includes("supera")) return "El archivo supera el tamaño máximo permitido.";
  if (text.includes("conex") || text.includes("fetch") || text.includes("network")) {
    return "No se pudo completar la subida por un problema de conexión.";
  }
  return message;
}

function fileExtension(name: string) {
  const split = name.toLowerCase().split(".");
  return split.length > 1 ? split[split.length - 1] ?? "" : "";
}

function resolveMime(file: File) {
  const extension = fileExtension(file.name);
  const byMime = file.type.trim().toLowerCase();
  return byMime || extensionToMime[extension] || "";
}

export function validateAssetFile(
  file: File,
  expectedKind: AssetKind | "any" = "any",
): { ok: true; kind: AssetKind; contentType: string } | { ok: false; error: string } {
  const mime = resolveMime(file);

  if (VIDEO_MOV_MIME_TYPES.has(mime)) {
    return { ok: false, error: "El formato MOV no está soportado en este flujo. Usa MP4 o WEBM." };
  }

  if (IMAGE_MIME_TYPES.has(mime)) {
    if (expectedKind === "video") {
      return { ok: false, error: "Este campo espera un vídeo y el archivo es una imagen." };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, error: "La imagen supera 20 MB." };
    }
    return { ok: true, kind: "image", contentType: mime };
  }

  if (VIDEO_MIME_TYPES.has(mime)) {
    if (expectedKind === "image") {
      return { ok: false, error: "Este campo espera una imagen y el archivo es un vídeo." };
    }
    if (file.size > MAX_VIDEO_BYTES) {
      return { ok: false, error: "El vídeo supera 350 MB." };
    }
    return { ok: true, kind: "video", contentType: mime };
  }

  return {
    ok: false,
    error: "Formato no permitido. Usa JPG, JPEG, PNG, WEBP, AVIF, SVG, MP4 o WEBM.",
  };
}

async function uploadWithProgress(params: {
  uploadUrl: string;
  file: File;
  contentType: string;
  onProgress?: (value: number) => void;
}) {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", params.uploadUrl, true);
    xhr.setRequestHeader("Content-Type", params.contentType);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !params.onProgress) return;
      const value = Math.min(100, Math.round((event.loaded / event.total) * 100));
      params.onProgress(value);
    };

    xhr.onerror = () => reject(new Error("No se pudo subir el archivo a R2."));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        params.onProgress?.(100);
        resolve();
        return;
      }
      reject(new Error("La subida a R2 falló."));
    };

    xhr.send(params.file);
  });
}

async function readMetadata(file: File, kind: AssetKind) {
  const url = URL.createObjectURL(file);
  try {
    if (kind === "image") {
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("No se pudo leer la imagen."));
        image.src = url;
      });
      return {
        width: image.naturalWidth || undefined,
        height: image.naturalHeight || undefined,
        durationSeconds: undefined as number | undefined,
      };
    }

    const video = document.createElement("video");
    video.preload = "metadata";
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("No se pudo leer el vídeo."));
      video.src = url;
    });
    return {
      width: video.videoWidth || undefined,
      height: video.videoHeight || undefined,
      durationSeconds: Number.isFinite(video.duration) ? video.duration : undefined,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function uploadAssetToLibrary(params: {
  file: File;
  expectedKind?: AssetKind | "any";
  scope?: AssetScope;
  pageKey?: string;
  sectionKey?: string;
  settingKey?: string;
  folder?: string;
  onProgress?: (value: number) => void;
}) {
  const validation = validateAssetFile(params.file, params.expectedKind ?? "any");
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const metadata = await readMetadata(params.file, validation.kind).catch(() => ({}));

  const presignResponse = await fetch("/api/admin/assets/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: params.file.name,
      contentType: validation.contentType,
      kind: validation.kind,
      fileSizeBytes: params.file.size,
      scope: params.scope ?? "general",
      pageKey: params.pageKey,
      sectionKey: params.sectionKey,
      settingKey: params.settingKey,
      folder: params.folder,
    }),
  });

  const presignPayload = await presignResponse.json();
  if (!presignResponse.ok) {
    throw new Error(presignPayload.error ?? "No se pudo preparar la subida.");
  }

  await uploadWithProgress({
    uploadUrl: String(presignPayload.uploadUrl),
    file: params.file,
    contentType: validation.contentType,
    onProgress: params.onProgress,
  });

  const commitResponse = await fetch("/api/admin/assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: params.file.name,
      kind: validation.kind,
      contentType: validation.contentType,
      storageKey: presignPayload.storageKey,
      publicUrl: presignPayload.publicUrl,
      fileSize: params.file.size,
      width: "width" in metadata ? metadata.width ?? null : null,
      height: "height" in metadata ? metadata.height ?? null : null,
      durationSeconds: "durationSeconds" in metadata ? metadata.durationSeconds ?? null : null,
      tags: [],
    }),
  });

  const commitPayload = await commitResponse.json();
  if (!commitResponse.ok) {
    throw new Error(commitPayload.error ?? "No se pudo registrar el recurso.");
  }

  return commitPayload.data as Tables<"cms_assets">;
}
