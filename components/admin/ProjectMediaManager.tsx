"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { MediaLibraryPicker } from "@/components/admin/MediaLibraryPicker";
import type { Tables } from "@/src/types/database.types";

type ProjectMediaRow = Tables<"project_media">;

type MediaKind = "image" | "video";
type MediaRole = "cover" | "hero" | "gallery" | "detail";
type UploadState = "pending" | "uploading" | "saved" | "error";

type UploadItem = {
  id: string;
  file: File;
  filename: string;
  size: number;
  kind: MediaKind;
  contentType: string;
  role: MediaRole;
  altText: string;
  caption: string;
  sortOrder: number;
  previewUrl: string;
  progress: number;
  state: UploadState;
  error: string | null;
};

type LibrarySelectionItem = {
  id: string;
  asset: Tables<"cms_assets">;
  role: MediaRole;
  altText: string;
  caption: string;
  sortOrder: number;
};

type ProjectMediaManagerProps = {
  projectId: string;
  initialMedia: ProjectMediaRow[];
  onRefreshProject: () => Promise<void>;
};

const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const VIDEO_MIME_TYPES = new Set(["video/mp4", "video/webm"]);
const VIDEO_MOV_MIME_TYPES = new Set(["video/quicktime", "video/mov"]);

const IMAGE_EXTENSION_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

const VIDEO_EXTENSION_TO_MIME: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 350 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value >= 100 ? value.toFixed(0) : value.toFixed(1)} ${units[idx]}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-ES");
}

function isMediaRole(value: string): value is MediaRole {
  return value === "cover" || value === "hero" || value === "gallery" || value === "detail";
}

function normalizeMediaRole(value: string): MediaRole {
  if (isMediaRole(value)) return value;
  return "gallery";
}

function roleLabel(role: string) {
  const normalized = normalizeMediaRole(role);
  if (normalized === "cover") return "Portada";
  if (normalized === "hero") return "Principal";
  if (normalized === "gallery") return "Galería";
  return "Detalle";
}

function isMediaKind(value: string): value is MediaKind {
  return value === "image" || value === "video";
}

function normalizeMediaKind(value: string, publicUrl: string): MediaKind {
  if (isMediaKind(value)) return value;
  const lower = publicUrl.toLowerCase();
  if (lower.endsWith(".mp4") || lower.endsWith(".webm")) return "video";
  return "image";
}

function kindLabel(kind: string, publicUrl = "") {
  const normalized = normalizeMediaKind(kind, publicUrl);
  return normalized === "image" ? "Imagen" : "Vídeo";
}

function uploadStateLabel(state: UploadState) {
  if (state === "pending") return "Pendiente";
  if (state === "uploading") return "Subiendo";
  if (state === "saved") return "Guardado";
  return "Error";
}

function uploadStateClasses(state: UploadState) {
  if (state === "pending") {
    return "border-white/20 bg-white/5 text-neutral-200";
  }
  if (state === "uploading") {
    return "border-sky-300/40 bg-sky-500/10 text-sky-200";
  }
  if (state === "saved") {
    return "border-emerald-300/40 bg-emerald-500/10 text-emerald-200";
  }
  return "border-red-300/40 bg-red-500/10 text-red-200";
}

function uploadProgressClasses(state: UploadState) {
  if (state === "error") return "bg-red-400";
  if (state === "saved") return "bg-emerald-400";
  if (state === "uploading") return "bg-sky-300";
  return "bg-white/60";
}

function sourceLabel(storageKey: string) {
  if (storageKey.startsWith("manual/")) return "URL manual";
  if (storageKey.startsWith("legacy/")) return "Legado";
  return "R2";
}

function fileExtension(name: string) {
  const split = name.toLowerCase().split(".");
  return split.length > 1 ? split[split.length - 1] ?? "" : "";
}

function normalizeError(message: string) {
  const text = message.toLowerCase();

  if (text.includes("r2 no está configurado")) return "La subida a R2 no está disponible en este momento.";
  if (text.includes("mime") || text.includes("formato")) return "Formato no permitido. Usa JPG, JPEG, PNG, WEBP, AVIF, MP4 o WEBM.";
  if (text.includes("supera")) return "El archivo supera el tamaño máximo permitido.";
  if (text.includes("url base") || text.includes("publicurl")) return "La URL del recurso no coincide con el dominio de media configurado.";
  if (text.includes("failed to fetch") || text.includes("network") || text.includes("conex")) return "No hay conexión suficiente para completar la subida.";

  return message;
}

function validateFile(file: File): { ok: true; kind: MediaKind; contentType: string } | { ok: false; error: string } {
  const extension = fileExtension(file.name);
  const fromMime = file.type.trim().toLowerCase();
  const mime = fromMime || IMAGE_EXTENSION_TO_MIME[extension] || VIDEO_EXTENSION_TO_MIME[extension] || "";

  if (VIDEO_MOV_MIME_TYPES.has(mime) || extension === "mov") {
    return { ok: false, error: "El formato MOV aún no está habilitado. Exporta el vídeo en MP4 o WEBM." };
  }

  if (IMAGE_MIME_TYPES.has(mime)) {
    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, error: `La imagen '${file.name}' supera 20 MB.` };
    }
    return { ok: true, kind: "image", contentType: mime };
  }

  if (VIDEO_MIME_TYPES.has(mime)) {
    if (file.size > MAX_VIDEO_BYTES) {
      return { ok: false, error: `El vídeo '${file.name}' supera 350 MB.` };
    }
    return { ok: true, kind: "video", contentType: mime };
  }

  return { ok: false, error: `El formato de '${file.name}' no está permitido.` };
}

async function uploadWithProgress(params: {
  uploadUrl: string;
  file: File;
  contentType: string;
  onProgress: (value: number) => void;
}) {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", params.uploadUrl, true);
    xhr.setRequestHeader("Content-Type", params.contentType);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const value = Math.min(100, Math.round((event.loaded / event.total) * 100));
      params.onProgress(value);
    };

    xhr.onerror = () => reject(new Error("No se pudo subir el archivo a R2."));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        params.onProgress(100);
        resolve();
        return;
      }
      reject(new Error("La subida directa a R2 falló."));
    };

    xhr.send(params.file);
  });
}

async function readMediaMetadata(file: File, kind: MediaKind) {
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

function reorderMedia(rows: ProjectMediaRow[], fromId: string, toId: string) {
  const fromIndex = rows.findIndex((item) => item.id === fromId);
  const toIndex = rows.findIndex((item) => item.id === toId);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return rows;

  const next = [...rows];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return rows;

  next.splice(toIndex, 0, moved);
  return next.map((item, idx) => ({ ...item, sort_order: idx }));
}

export function ProjectMediaManager({
  projectId,
  initialMedia,
  onRefreshProject,
}: ProjectMediaManagerProps) {
  const [mediaRows, setMediaRows] = useState<ProjectMediaRow[]>(
    [...initialMedia].sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)),
  );

  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isDropzoneActive, setIsDropzoneActive] = useState(false);
  const [manualModeOpen, setManualModeOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSavingLibrarySelection, setIsSavingLibrarySelection] = useState(false);
  const [librarySelection, setLibrarySelection] = useState<LibrarySelectionItem[]>([]);
  const [draggedMediaId, setDraggedMediaId] = useState<string | null>(null);
  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [savingMediaIdMap, setSavingMediaIdMap] = useState<Record<string, boolean>>({});
  const [dirtyMediaIdMap, setDirtyMediaIdMap] = useState<Record<string, boolean>>({});

  const [manualUrl, setManualUrl] = useState("");
  const [manualKind, setManualKind] = useState<MediaKind>("image");
  const [manualRole, setManualRole] = useState<MediaRole>("gallery");
  const [manualAltText, setManualAltText] = useState("");
  const [manualCaption, setManualCaption] = useState("");
  const [manualSortOrder, setManualSortOrder] = useState("0");
  const [manualWidth, setManualWidth] = useState("");
  const [manualHeight, setManualHeight] = useState("");
  const [manualDuration, setManualDuration] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewRegistry = useRef<Set<string>>(new Set());

  const acceptedMimeList = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES].join(",");

  const highestSortOrder = useMemo(() => {
    const savedMax = mediaRows.reduce((acc, row) => Math.max(acc, row.sort_order), -1);
    const queueMax = uploadQueue.reduce((acc, row) => Math.max(acc, row.sortOrder), -1);
    return Math.max(savedMax, queueMax);
  }, [mediaRows, uploadQueue]);

  const pendingUploadCount = uploadQueue.filter((item) => item.state !== "saved").length;
  const queueErrorCount = uploadQueue.filter((item) => item.state === "error").length;
  const successfulQueueCount = uploadQueue.filter((item) => item.state === "saved").length;

  useEffect(() => {
    setMediaRows(
      [...initialMedia].sort(
        (a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at),
      ),
    );
    setDirtyMediaIdMap({});
    setHasUnsavedOrder(false);
  }, [initialMedia]);

  useEffect(() => {
    return () => {
      previewRegistry.current.forEach((url) => URL.revokeObjectURL(url));
      previewRegistry.current.clear();
    };
  }, []);

  function markSaving(id: string, value: boolean) {
    setSavingMediaIdMap((prev) => {
      if (!value) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: true };
    });
  }

  function markDirty(id: string, value: boolean) {
    setDirtyMediaIdMap((prev) => {
      if (!value) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: true };
    });
  }

  function updateQueueItem(id: string, patch: Partial<UploadItem>) {
    setUploadQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function updateMediaItem(id: string, patch: Partial<ProjectMediaRow>) {
    setMediaRows((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    markDirty(id, true);
  }

  function addFilesToQueue(files: File[]) {
    if (!files.length) return;

    let nextOrder = highestSortOrder + 1;
    const nextItems: UploadItem[] = [];
    const localErrors: string[] = [];

    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.ok) {
        localErrors.push(validation.error);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      previewRegistry.current.add(previewUrl);

      nextItems.push({
        id: crypto.randomUUID(),
        file,
        filename: file.name,
        size: file.size,
        kind: validation.kind,
        contentType: validation.contentType,
        role: "gallery",
        altText: "",
        caption: "",
        sortOrder: nextOrder,
        previewUrl,
        progress: 0,
        state: "pending",
        error: null,
      });

      nextOrder += 1;
    }

    if (nextItems.length) {
      setUploadQueue((prev) => [...prev, ...nextItems]);
      setError("");
      setMessage(`${nextItems.length} archivo(s) añadido(s) a la cola.`);
    }

    if (localErrors.length) {
      setError(localErrors.join(" "));
    }
  }

  function removeQueueItem(id: string) {
    setUploadQueue((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target && previewRegistry.current.has(target.previewUrl)) {
        URL.revokeObjectURL(target.previewUrl);
        previewRegistry.current.delete(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  }

  function clearSavedQueueItems() {
    setUploadQueue((prev) => {
      const next = prev.filter((item) => item.state !== "saved");
      prev.forEach((item) => {
        if (item.state === "saved" && previewRegistry.current.has(item.previewUrl)) {
          URL.revokeObjectURL(item.previewUrl);
          previewRegistry.current.delete(item.previewUrl);
        }
      });
      return next;
    });
  }

  async function refreshAll() {
    await onRefreshProject();
  }

  async function processUploadQueue() {
    if (!uploadQueue.length) {
      setError("Añade archivos a la cola antes de subir.");
      return;
    }

    const pending = uploadQueue.filter((item) => item.state !== "saved");
    if (!pending.length) {
      setMessage("La cola ya está guardada.");
      return;
    }

    setIsUploading(true);
    setError("");
    setMessage("");
    let successCount = 0;

    for (const item of pending) {
      const needsAlt = item.role === "cover" || item.role === "hero";
      if (needsAlt && !item.altText.trim()) {
        updateQueueItem(item.id, {
          state: "error",
          error: "El texto alternativo es obligatorio para portada y principal.",
        });
        continue;
      }

      try {
        updateQueueItem(item.id, { state: "uploading", progress: 5, error: null });

        const presignResponse = await fetch("/api/admin/media/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: item.filename,
            contentType: item.contentType,
            kind: item.kind,
            projectId,
            fileSizeBytes: item.size,
          }),
        });

        const presignPayload = await presignResponse.json();
        if (!presignResponse.ok) {
          throw new Error(normalizeError(String(presignPayload.error ?? "No se pudo preparar la subida.")));
        }

        await uploadWithProgress({
          uploadUrl: String(presignPayload.uploadUrl),
          file: item.file,
          contentType: item.contentType,
          onProgress: (value) => {
            updateQueueItem(item.id, { state: "uploading", progress: value });
          },
        });

        let metadata: { width?: number; height?: number; durationSeconds?: number } = {};
        try {
          metadata = await readMediaMetadata(item.file, item.kind);
        } catch {
          metadata = {};
        }

        const commitResponse = await fetch("/api/admin/media/commit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            kind: item.kind,
            role: item.role,
            storageKey: presignPayload.storageKey,
            publicUrl: presignPayload.publicUrl,
            altText: item.altText.trim() || null,
            caption: item.caption.trim() || null,
            width: metadata.width ?? null,
            height: metadata.height ?? null,
            durationSeconds: metadata.durationSeconds ?? null,
            sortOrder: item.sortOrder,
          }),
        });

        const commitPayload = await commitResponse.json();
        if (!commitResponse.ok) {
          throw new Error(normalizeError(String(commitPayload.error ?? "No se pudo registrar el recurso.")));
        }

        updateQueueItem(item.id, { state: "saved", progress: 100, error: null });
        successCount += 1;
      } catch (uploadError) {
        updateQueueItem(item.id, {
          state: "error",
          error: normalizeError(
            uploadError instanceof Error ? uploadError.message : "Error inesperado al subir el archivo.",
          ),
        });
      }
    }

    if (successCount > 0) {
      setUploadQueue((prev) => {
        const next = prev.filter((item) => item.state !== "saved");
        prev.forEach((item) => {
          if (item.state === "saved" && previewRegistry.current.has(item.previewUrl)) {
            URL.revokeObjectURL(item.previewUrl);
            previewRegistry.current.delete(item.previewUrl);
          }
        });
        return next;
      });
      await refreshAll();
      setMessage(
        successCount === pending.length
          ? "Subida completada. Recursos listos en la biblioteca."
          : `Subida parcial: ${successCount} recurso(s) guardado(s).`,
      );
    } else {
      setError("No se pudo guardar ningún recurso. Revisa los errores por archivo.");
    }

    setIsUploading(false);
  }

  async function saveManualMedia(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!manualUrl.trim()) {
      setError("Introduce una URL o ruta válida.");
      return;
    }

    if ((manualRole === "cover" || manualRole === "hero") && !manualAltText.trim()) {
      setError("El texto alternativo es obligatorio para portada y principal.");
      return;
    }

    setIsUploading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/media/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          kind: manualKind,
          role: manualRole,
          publicUrl: manualUrl.trim(),
          sourceType: "manual",
          altText: manualAltText.trim() || null,
          caption: manualCaption.trim() || null,
          width: manualWidth ? Number(manualWidth) : null,
          height: manualHeight ? Number(manualHeight) : null,
          durationSeconds: manualDuration ? Number(manualDuration) : null,
          sortOrder: Number(manualSortOrder || 0),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(normalizeError(String(payload.error ?? "No se pudo registrar el recurso manual.")));
      }

      setManualUrl("");
      setManualAltText("");
      setManualCaption("");
      setManualSortOrder("0");
      setManualWidth("");
      setManualHeight("");
      setManualDuration("");

      await refreshAll();
      setMessage("Recurso manual guardado.");
    } catch (commitError) {
      setError(
        normalizeError(
          commitError instanceof Error ? commitError.message : "Error inesperado al guardar el recurso manual.",
        ),
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function saveMediaRow(item: ProjectMediaRow) {
    if ((item.role === "cover" || item.role === "hero") && !item.alt_text?.trim()) {
      setError("El texto alternativo es obligatorio para portada y principal.");
      return;
    }

    markSaving(item.id, true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/media/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          role: item.role,
          altText: item.alt_text?.trim() || null,
          caption: item.caption?.trim() || null,
          sortOrder: item.sort_order,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(normalizeError(String(payload.error ?? "No se pudo actualizar el recurso.")));
      }

      setMediaRows((prev) => prev.map((row) => (row.id === item.id ? payload.data : row)));
      markDirty(item.id, false);
      setMessage("Cambios del recurso guardados.");
    } catch (saveError) {
      setError(normalizeError(saveError instanceof Error ? saveError.message : "Error al guardar el recurso."));
    } finally {
      markSaving(item.id, false);
    }
  }

  function handleAddFromLibrary(selectedAssets: Array<Tables<"cms_assets">>) {
    if (!selectedAssets.length) return;

    setError("");
    setMessage("");

    let nextSort =
      Math.max(
        mediaRows.reduce((acc, item) => Math.max(acc, item.sort_order), -1),
        librarySelection.reduce((acc, item) => Math.max(acc, item.sortOrder), -1),
      ) + 1;

    const existingStorageKeys = new Set([
      ...mediaRows.map((item) => item.storage_key),
      ...librarySelection.map((item) => item.asset.storage_key),
    ]);

    const toAppend: LibrarySelectionItem[] = [];
    selectedAssets.forEach((asset) => {
      if (existingStorageKeys.has(asset.storage_key)) {
        return;
      }
      existingStorageKeys.add(asset.storage_key);
      toAppend.push({
        id: crypto.randomUUID(),
        asset,
        role: "gallery",
        altText: asset.alt_text ?? "",
        caption: "",
        sortOrder: nextSort,
      });
      nextSort += 1;
    });

    if (!toAppend.length) {
      setMessage("Los recursos seleccionados ya están en el proyecto o en la selección pendiente.");
      return;
    }

    setLibrarySelection((prev) => [...prev, ...toAppend]);
    setMessage(
      toAppend.length === 1
        ? "Recurso añadido a la selección pendiente."
        : `${toAppend.length} recursos añadidos a la selección pendiente.`,
    );
  }

  function updateLibrarySelectionItem(id: string, patch: Partial<LibrarySelectionItem>) {
    setLibrarySelection((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function removeLibrarySelectionItem(id: string) {
    setLibrarySelection((prev) => prev.filter((item) => item.id !== id));
  }

  async function saveLibrarySelection() {
    if (!librarySelection.length) {
      setError("No hay recursos pendientes de biblioteca.");
      return;
    }

    for (const item of librarySelection) {
      if ((item.role === "cover" || item.role === "hero") && !item.altText.trim()) {
        setError("El texto alternativo es obligatorio para portada y principal.");
        return;
      }
    }

    setIsSavingLibrarySelection(true);
    setError("");
    setMessage("");

    let savedCount = 0;
    const errors: string[] = [];
    const failedItems: LibrarySelectionItem[] = [];

    for (const item of librarySelection) {
      try {
        const response = await fetch("/api/admin/media/commit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            kind: normalizeMediaKind(item.asset.kind, item.asset.public_url),
            role: item.role,
            storageKey: item.asset.storage_key,
            publicUrl: item.asset.public_url,
            sourceType: "r2",
            altText: item.altText.trim() || null,
            caption: item.caption.trim() || null,
            width: item.asset.width ?? null,
            height: item.asset.height ?? null,
            durationSeconds: item.asset.duration_seconds ?? null,
            sortOrder: item.sortOrder,
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(
            normalizeError(
              String(payload.error ?? "No se pudo guardar un recurso desde la biblioteca."),
            ),
          );
        }

        savedCount += 1;
      } catch (saveError) {
        failedItems.push(item);
        errors.push(
          normalizeError(
            saveError instanceof Error
              ? saveError.message
              : "No se pudo guardar un recurso desde la biblioteca.",
          ),
        );
      }
    }

    if (savedCount > 0) {
      await refreshAll();
      setLibrarySelection(failedItems);
      setMessage(
        savedCount === 1
          ? "Recurso guardado desde biblioteca."
          : `${savedCount} recursos guardados desde biblioteca.`,
      );
    }

    if (errors.length > 0) {
      setError(errors[0] ?? "No se pudieron guardar algunos recursos de biblioteca.");
    }

    setIsSavingLibrarySelection(false);
  }

  async function saveMediaOrder() {
    setSavingOrder(true);
    setError("");
    setMessage("");

    try {
      for (const item of mediaRows) {
        const response = await fetch("/api/admin/media/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, sortOrder: item.sort_order }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(normalizeError(String(payload.error ?? "No se pudo guardar el orden.")));
        }
      }

      setHasUnsavedOrder(false);
      await refreshAll();
      setMessage("Orden guardado.");
    } catch (orderError) {
      setError(normalizeError(orderError instanceof Error ? orderError.message : "Error al guardar el orden."));
    } finally {
      setSavingOrder(false);
    }
  }

  async function deleteMediaRow(id: string) {
    if (!confirm("¿Quieres eliminar este recurso? Esta acción no se puede deshacer.")) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/media/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(normalizeError(String(payload.error ?? "No se pudo eliminar el recurso.")));
      }

      await refreshAll();
      setMessage("Recurso eliminado.");
    } catch (deleteError) {
      setError(
        normalizeError(
          deleteError instanceof Error ? deleteError.message : "Error inesperado al eliminar el recurso.",
        ),
      );
    }
  }

  function moveRow(id: string, delta: -1 | 1) {
    setMediaRows((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index < 0) return prev;

      const nextIndex = index + delta;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;

      const next = [...prev];
      const [moved] = next.splice(index, 1);
      if (!moved) return prev;
      next.splice(nextIndex, 0, moved);
      return next.map((item, rowIndex) => ({ ...item, sort_order: rowIndex }));
    });

    setHasUnsavedOrder(true);
  }

  function onDropSavedRow(targetId: string) {
    if (!draggedMediaId) return;
    setMediaRows((prev) => reorderMedia(prev, draggedMediaId, targetId));
    setDraggedMediaId(null);
    setHasUnsavedOrder(true);
    setMessage("Orden actualizado. Falta guardar.");
  }

  return (
    <section className="space-y-6 rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent p-5 shadow-[0_10px_35px_-20px_rgba(16,185,129,0.35)]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-3xl tracking-wide">Recursos</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-neutral-300">
              Biblioteca: {mediaRows.length}
            </span>
            <span className="rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-neutral-300">
              Cola: {pendingUploadCount}
            </span>
          </div>
        </div>
        <p className="text-sm text-neutral-300">
          Arrastra archivos o selecciónalos con clic. Se guardan en R2 y aparecen automáticamente en la biblioteca.
        </p>
        <p className="text-xs text-neutral-500">Formatos: JPG, JPEG, PNG, WEBP, AVIF, MP4 y WEBM.</p>
      </div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDropzoneActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDropzoneActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDropzoneActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDropzoneActive(false);
          addFilesToQueue(Array.from(event.dataTransfer.files ?? []));
        }}
        className={`group relative flex min-h-52 w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed px-6 py-8 text-center transition-all ${
          isDropzoneActive
            ? "border-emerald-300/80 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(52,211,153,0.35)]"
            : "border-white/20 bg-black/35 hover:border-white/40 hover:bg-black/45"
        }`}
      >
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 text-xs uppercase tracking-[0.14em] text-neutral-200">
          R2
        </span>
        <span className="relative mt-4 font-display text-3xl tracking-wide text-white">Arrastra imágenes o vídeos aquí</span>
        <span className="relative mt-2 text-sm text-neutral-300">o haz clic para seleccionarlos</span>
        <span className="relative mt-4 text-xs text-neutral-500">Límite: 20 MB por imagen y 350 MB por vídeo</span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedMimeList}
        multiple
        className="hidden"
        onChange={(event) => {
          addFilesToQueue(Array.from(event.target.files ?? []));
          event.currentTarget.value = "";
        }}
      />

      <MediaLibraryPicker
        abierto={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onConfirm={(assets) => void handleAddFromLibrary(assets)}
        seleccionMultiple
        tipoPermitido="all"
        textoConfirmar="Añadir a selección"
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void processUploadQueue()}
          disabled={isUploading || pendingUploadCount === 0}
          className="rounded-md border border-emerald-300/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-neutral-500"
        >
          {isUploading ? "Subiendo recursos..." : `Subir ${pendingUploadCount} archivo(s)`}
        </button>
        <button
          type="button"
          onClick={clearSavedQueueItems}
          disabled={!uploadQueue.some((item) => item.state === "saved")}
          className="rounded-md border border-white/15 px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed"
        >
          Limpiar guardados de la cola
        </button>
        <button
          type="button"
          onClick={() => setIsLibraryOpen(true)}
          disabled={isSavingLibrarySelection}
          className="rounded-md border border-white/15 px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed"
        >
          {isSavingLibrarySelection ? "Guardando..." : "Abrir biblioteca"}
        </button>
      </div>

      {librarySelection.length ? (
        <div className="space-y-4 rounded-lg border border-white/10 bg-black/25 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-xl tracking-wide">Selección desde biblioteca</h3>
            <button
              type="button"
              onClick={() => void saveLibrarySelection()}
              disabled={isSavingLibrarySelection}
              className="rounded-md border border-emerald-300/35 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-100 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed"
            >
              {isSavingLibrarySelection ? "Guardando..." : "Guardar seleccionados"}
            </button>
          </div>
          <p className="text-xs text-neutral-400">
            Ajusta rol, texto alternativo, pie y orden antes de guardar en el proyecto.
          </p>
          <div className="grid gap-3 lg:grid-cols-2">
            {librarySelection.map((item) => {
              const needsAlt = item.role === "cover" || item.role === "hero";
              const assetKind = normalizeMediaKind(item.asset.kind, item.asset.public_url);
              return (
                <article
                  key={item.id}
                  className="space-y-3 rounded-lg border border-white/10 bg-black/35 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="truncate text-sm font-medium text-white">{item.asset.filename}</p>
                      <p className="text-xs text-neutral-400">{kindLabel(assetKind)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLibrarySelectionItem(item.id)}
                      className="rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-300 transition-colors hover:bg-red-500/10"
                    >
                      Quitar
                    </button>
                  </div>
                  <div className="overflow-hidden rounded-md border border-white/10 bg-black/40">
                    {assetKind === "image" ? (
                      <img
                        src={item.asset.public_url}
                        alt={item.altText || item.asset.filename}
                        className="h-36 w-full object-cover"
                      />
                    ) : (
                      <video src={item.asset.public_url} controls className="h-36 w-full object-cover" />
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-sm">
                      <span className="text-neutral-300">Rol</span>
                      <select
                        value={item.role}
                        onChange={(event) =>
                          updateLibrarySelectionItem(item.id, {
                            role: event.target.value as MediaRole,
                          })
                        }
                        className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm"
                      >
                        <option value="cover">Portada</option>
                        <option value="hero">Principal</option>
                        <option value="gallery">Galería</option>
                        <option value="detail">Detalle</option>
                      </select>
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="text-neutral-300">Orden</span>
                      <input
                        type="number"
                        min={0}
                        value={item.sortOrder}
                        onChange={(event) => {
                          const parsed = Number(event.target.value || "0");
                          updateLibrarySelectionItem(item.id, {
                            sortOrder: Number.isFinite(parsed) ? parsed : 0,
                          });
                        }}
                        className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                  <label className="space-y-1 text-sm">
                    <span className="text-neutral-300">
                      Texto alternativo{needsAlt ? " (obligatorio para este rol)" : ""}
                    </span>
                    <input
                      value={item.altText}
                      onChange={(event) =>
                        updateLibrarySelectionItem(item.id, { altText: event.target.value })
                      }
                      className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm"
                      placeholder="Describe el contenido visual"
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-neutral-300">Pie de foto</span>
                    <input
                      value={item.caption}
                      onChange={(event) =>
                        updateLibrarySelectionItem(item.id, { caption: event.target.value })
                      }
                      className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm"
                      placeholder="Opcional"
                    />
                  </label>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      {message ? (
        <div className="rounded-lg border border-emerald-300/35 bg-gradient-to-r from-emerald-500/15 to-emerald-400/5 px-4 py-3 text-sm text-emerald-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{message}</span>
            <span className="text-xs uppercase tracking-[0.12em] text-emerald-200/80">Listo</span>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-300/35 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {(queueErrorCount > 0 || successfulQueueCount > 0) && !isUploading ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
          {queueErrorCount > 0 ? (
            <span className="rounded-full border border-red-300/30 bg-red-500/10 px-2.5 py-1 text-red-200">
              Errores en cola: {queueErrorCount}
            </span>
          ) : null}
          {successfulQueueCount > 0 ? (
            <span className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-200">
              Guardados en cola: {successfulQueueCount}
            </span>
          ) : null}
        </div>
      ) : null}

      {uploadQueue.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {uploadQueue.map((item) => {
            const needsAlt = item.role === "cover" || item.role === "hero";

            return (
              <article key={item.id} className="space-y-3 rounded-lg border border-white/10 bg-black/35 p-3 shadow-[0_10px_24px_-20px_rgba(255,255,255,0.45)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="max-w-[18rem] truncate text-sm font-medium text-white">{item.filename}</p>
                    <p className="text-xs text-neutral-400">{kindLabel(item.kind)} · {formatBytes(item.size)}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${uploadStateClasses(item.state)}`}>
                    {uploadStateLabel(item.state)}
                  </span>
                </div>

                <div className="overflow-hidden rounded-md border border-white/10 bg-black/40">
                  {item.kind === "image" ? (
                    <img src={item.previewUrl} alt={item.altText || "Vista previa"} className="h-44 w-full object-cover" />
                  ) : (
                    <video src={item.previewUrl} controls className="h-44 w-full object-cover" />
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <span className="text-neutral-300">Rol</span>
                    <select
                      value={item.role}
                      onChange={(event) => updateQueueItem(item.id, { role: event.target.value as MediaRole })}
                      className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
                    >
                      <option value="cover">Portada</option>
                      <option value="hero">Principal</option>
                      <option value="gallery">Galería</option>
                      <option value="detail">Detalle</option>
                    </select>
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="text-neutral-300">Orden</span>
                    <input
                      type="number"
                      min={0}
                      value={item.sortOrder}
                      onChange={(event) => {
                        const parsed = Number(event.target.value || "0");
                        updateQueueItem(item.id, { sortOrder: Number.isFinite(parsed) ? parsed : 0 });
                      }}
                      className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
                    />
                  </label>
                </div>

                <label className="space-y-1 text-sm">
                  <span className="text-neutral-300">Texto alternativo{needsAlt ? " (obligatorio para este rol)" : ""}</span>
                  <input
                    value={item.altText}
                    onChange={(event) => updateQueueItem(item.id, { altText: event.target.value })}
                    placeholder="Describe el contenido visual"
                    className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="text-neutral-300">Pie de foto</span>
                  <input
                    value={item.caption}
                    onChange={(event) => updateQueueItem(item.id, { caption: event.target.value })}
                    placeholder="Opcional"
                    className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
                  />
                </label>

                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full transition-all ${uploadProgressClasses(item.state)}`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <p className="text-[11px] text-neutral-500">Progreso: {item.progress}%</p>

                {item.error ? <p className="text-xs text-red-300">{item.error}</p> : null}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeQueueItem(item.id)}
                    disabled={item.state === "uploading"}
                    className="rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-300 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed"
                  >
                    Quitar de la cola
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 bg-black/25 p-5 text-sm text-neutral-400">No hay archivos en la cola de subida.</div>
      )}

      <details
        open={manualModeOpen}
        onToggle={(event) => setManualModeOpen((event.target as HTMLDetailsElement).open)}
        className="rounded-lg border border-white/10 bg-black/25 p-4"
      >
        <summary className="cursor-pointer select-none text-sm font-medium text-neutral-200">Modo avanzado por URL</summary>
        <form onSubmit={saveManualMedia} className="mt-4 grid gap-4">
          <label className="space-y-1 text-sm">
            <span className="text-neutral-300">URL pública o ruta local</span>
            <input
              value={manualUrl}
              onChange={(event) => setManualUrl(event.target.value)}
              placeholder="https://... o /assets/..."
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-4">
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Tipo</span>
              <select value={manualKind} onChange={(event) => setManualKind(event.target.value as MediaKind)} className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm"><option value="image">Imagen</option><option value="video">Vídeo</option></select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Rol</span>
              <select value={manualRole} onChange={(event) => setManualRole(event.target.value as MediaRole)} className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm"><option value="cover">Portada</option><option value="hero">Principal</option><option value="gallery">Galería</option><option value="detail">Detalle</option></select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Orden</span>
              <input type="number" min={0} value={manualSortOrder} onChange={(event) => setManualSortOrder(event.target.value)} className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm" placeholder="Orden" />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Texto alternativo</span>
              <input value={manualAltText} onChange={(event) => setManualAltText(event.target.value)} placeholder="Obligatorio para portada y principal" className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Pie de foto</span>
              <input value={manualCaption} onChange={(event) => setManualCaption(event.target.value)} placeholder="Opcional" className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Ancho</span>
              <input type="number" min={1} value={manualWidth} onChange={(event) => setManualWidth(event.target.value)} placeholder="Opcional" className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Alto</span>
              <input type="number" min={1} value={manualHeight} onChange={(event) => setManualHeight(event.target.value)} placeholder="Opcional" className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-neutral-300">Duración (segundos)</span>
              <input type="number" min={0.1} step={0.1} value={manualDuration} onChange={(event) => setManualDuration(event.target.value)} placeholder="Solo para vídeo" className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm" />
            </label>
          </div>
          <button type="submit" disabled={isUploading} className="w-fit rounded-md border border-white/25 px-4 py-2 text-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed">{isUploading ? "Guardando..." : "Guardar recurso manual"}</button>
        </form>
      </details>

      <div className="space-y-3 border-t border-white/10 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-2xl tracking-wide">Biblioteca del proyecto</h3>
          {hasUnsavedOrder ? (
            <span className="rounded-full border border-amber-300/40 bg-amber-500/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-amber-200">
              Orden sin guardar
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void saveMediaOrder()}
            disabled={!hasUnsavedOrder || savingOrder}
            className="w-full rounded-md border border-white/25 px-3 py-2 text-xs uppercase tracking-[0.1em] text-neutral-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-neutral-500 sm:w-auto"
          >
            {savingOrder ? "Guardando orden..." : "Guardar orden"}
          </button>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs text-neutral-400">
          <p className="hidden md:block">Ordena arrastrando las tarjetas o con los botones Subir/Bajar.</p>
          <p className="md:hidden">En móvil, usa los botones Subir/Bajar y guarda el orden al final.</p>
        </div>

        {hasUnsavedOrder ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            <span>Hay cambios de orden pendientes.</span>
            <button
              type="button"
              onClick={() => void saveMediaOrder()}
              disabled={savingOrder}
              className="rounded-md border border-amber-200/40 px-2.5 py-1 text-[11px] uppercase tracking-[0.1em] transition-colors hover:bg-amber-300/20 disabled:cursor-not-allowed"
            >
              {savingOrder ? "Guardando..." : "Guardar ahora"}
            </button>
          </div>
        ) : null}

        {mediaRows.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {mediaRows.map((item, index) => {
              const isSavingItem = Boolean(savingMediaIdMap[item.id]);
              const isDirtyItem = Boolean(dirtyMediaIdMap[item.id]);
              const needsAlt = item.role === "cover" || item.role === "hero";
              const mediaKind = normalizeMediaKind(item.kind, item.public_url);

              return (
                <article key={item.id} draggable onDragStart={() => setDraggedMediaId(item.id)} onDragEnd={() => setDraggedMediaId(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => onDropSavedRow(item.id)} className="space-y-3 rounded-lg border border-white/10 bg-black/35 p-3 md:cursor-grab">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{kindLabel(mediaKind)} · Posición {index + 1}</p>
                      <p className="text-xs text-neutral-400">{sourceLabel(item.storage_key)} · Creado {formatDate(item.created_at)}</p>
                    </div>
                    <span className="rounded-full border border-white/20 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-neutral-300">{roleLabel(item.role)}</span>
                  </div>
                  <p className="hidden text-[11px] text-neutral-500 md:block">Puedes arrastrar esta tarjeta para reordenar.</p>

                  <div className="overflow-hidden rounded-md border border-white/10 bg-black/40">
                    {mediaKind === "image" ? <img src={item.public_url} alt={item.alt_text ?? "Recurso del proyecto"} className="h-44 w-full object-cover" /> : <video src={item.public_url} controls className="h-44 w-full object-cover" />}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-sm">
                      <span className="text-neutral-300">Rol</span>
                      <select value={item.role} onChange={(event) => updateMediaItem(item.id, { role: event.target.value as MediaRole })} className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm"><option value="cover">Portada</option><option value="hero">Principal</option><option value="gallery">Galería</option><option value="detail">Detalle</option></select>
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="text-neutral-300">Orden</span>
                      <input type="number" min={0} value={item.sort_order} onChange={(event) => { const parsed = Number(event.target.value || "0"); updateMediaItem(item.id, { sort_order: Number.isFinite(parsed) ? parsed : 0 }); setHasUnsavedOrder(true); }} className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm" />
                    </label>
                  </div>

                  <label className="space-y-1 text-sm">
                    <span className="text-neutral-300">Texto alternativo</span>
                    <input value={item.alt_text ?? ""} onChange={(event) => updateMediaItem(item.id, { alt_text: event.target.value })} placeholder="Describe la imagen o el vídeo" className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm" />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-neutral-300">Pie de foto</span>
                    <input value={item.caption ?? ""} onChange={(event) => updateMediaItem(item.id, { caption: event.target.value })} placeholder="Opcional" className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm" />
                  </label>

                  {needsAlt && !item.alt_text?.trim() ? <p className="text-xs text-red-300">Este recurso necesita texto alternativo para poder guardarse.</p> : null}

                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => moveRow(item.id, -1)} disabled={index === 0} className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-neutral-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:text-neutral-500">Subir</button>
                    <button type="button" onClick={() => moveRow(item.id, 1)} disabled={index === mediaRows.length - 1} className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-neutral-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:text-neutral-500">Bajar</button>
                    <button type="button" onClick={() => void saveMediaRow(item)} disabled={isSavingItem || !isDirtyItem} className="rounded-md border border-white/25 px-3 py-1 text-xs text-neutral-100 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-neutral-500">{isSavingItem ? "Guardando..." : "Guardar cambios"}</button>
                    <button type="button" onClick={() => void deleteMediaRow(item.id)} className="rounded-md border border-red-400/30 px-3 py-1 text-xs text-red-300 transition-colors hover:bg-red-500/10">Eliminar</button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-black/25 p-5 text-sm text-neutral-400">Este proyecto todavía no tiene recursos.</div>
        )}
      </div>
    </section>
  );
}
