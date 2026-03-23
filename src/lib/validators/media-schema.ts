import { z } from "zod";

export const projectMediaKindSchema = z.enum(["image", "video"]);
export const projectMediaRoleSchema = z.enum(["cover", "hero", "gallery", "detail"]);

export const allowedImageMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
] as const;

export const allowedVideoMimeTypes = ["video/mp4", "video/webm"] as const;

export const maxImageBytes = 20 * 1024 * 1024;
export const maxVideoBytes = 350 * 1024 * 1024;

const urlOrPathSchema = z.string().trim().min(1).max(500).refine((value) => {
  if (value.startsWith("/")) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}, "La URL del recurso debe ser http(s) o una ruta absoluta que empiece por /.");

const basePresignSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(3).max(120),
  kind: projectMediaKindSchema,
  projectId: z.string().uuid().optional(),
  fileSizeBytes: z.number().int().positive(),
});

export const mediaPresignSchema = basePresignSchema.superRefine((value, ctx) => {
  const isImage = value.kind === "image";
  const allowedMimes = new Set<string>(
    isImage ? [...allowedImageMimeTypes] : [...allowedVideoMimeTypes],
  );

  if (!allowedMimes.has(value.contentType)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Formato de archivo no permitido para este tipo de recurso.",
      path: ["contentType"],
    });
  }

  if (isImage && value.fileSizeBytes > maxImageBytes) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `La imagen supera ${Math.floor(maxImageBytes / (1024 * 1024))}MB.`,
      path: ["fileSizeBytes"],
    });
  }

  if (!isImage && value.fileSizeBytes > maxVideoBytes) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `El vídeo supera ${Math.floor(maxVideoBytes / (1024 * 1024))}MB.`,
      path: ["fileSizeBytes"],
    });
  }
});

export const mediaCommitSchema = z
  .object({
    projectId: z.string().uuid(),
    kind: projectMediaKindSchema,
    role: projectMediaRoleSchema,
    storageKey: z.string().trim().min(3).max(500).optional(),
    publicUrl: urlOrPathSchema,
    sourceType: z.enum(["r2", "manual"]).default("r2"),
    altText: z.string().trim().max(240).optional().nullable(),
    caption: z.string().trim().max(500).optional().nullable(),
    width: z.number().int().positive().optional().nullable(),
    height: z.number().int().positive().optional().nullable(),
    durationSeconds: z.number().positive().optional().nullable(),
    sortOrder: z.number().int().min(0).max(9999).default(0),
  })
  .superRefine((value, ctx) => {
    if ((value.role === "cover" || value.role === "hero") && !value.altText?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El texto alternativo es obligatorio para portada y principal.",
        path: ["altText"],
      });
    }
  });

export const mediaUpdateSchema = z
  .object({
    id: z.string().uuid(),
    role: projectMediaRoleSchema.optional(),
    altText: z.string().trim().max(240).optional().nullable(),
    caption: z.string().trim().max(500).optional().nullable(),
    sortOrder: z.number().int().min(0).max(9999).optional(),
  })
  .refine(
    (value) =>
      value.role !== undefined ||
      value.altText !== undefined ||
      value.caption !== undefined ||
      value.sortOrder !== undefined,
    {
      message: "Debes enviar al menos un campo para actualizar.",
    },
  );

export const mediaDeleteSchema = z
  .object({
    id: z.string().uuid().optional(),
    storageKey: z.string().trim().min(3).max(500).optional(),
  })
  .refine((value) => Boolean(value.id || value.storageKey), {
    message: "Debes indicar el identificador del recurso o su clave de almacenamiento.",
  });
