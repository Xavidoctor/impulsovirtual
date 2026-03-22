import { z } from "zod";

import {
  allowedImageMimeTypes,
  allowedVideoMimeTypes,
  maxImageBytes,
  maxVideoBytes,
} from "@/src/lib/validators/media-schema";

export const assetKindSchema = z.enum(["image", "video"]);
export const assetScopeSchema = z.enum([
  "project",
  "section",
  "setting",
  "general",
  "blog",
  "brand",
  "site",
  "proposals",
]);

const urlSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine((value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }, "La URL pública del recurso no es válida.");

export const assetPresignSchema = z
  .object({
    filename: z.string().trim().min(1).max(255),
    contentType: z.string().trim().min(3).max(120),
    kind: assetKindSchema,
    fileSizeBytes: z.number().int().positive(),
    scope: assetScopeSchema.default("general"),
    pageKey: z.string().trim().min(1).max(64).optional(),
    sectionKey: z.string().trim().min(1).max(64).optional(),
    settingKey: z.string().trim().min(1).max(64).optional(),
    folder: z.string().trim().min(1).max(120).optional(),
  })
  .superRefine((value, ctx) => {
    const allowedMimes = new Set<string>(
      value.kind === "image" ? [...allowedImageMimeTypes] : [...allowedVideoMimeTypes],
    );

    if (!allowedMimes.has(value.contentType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Formato de archivo no permitido para este tipo de recurso.",
        path: ["contentType"],
      });
    }

    if (value.kind === "image" && value.fileSizeBytes > maxImageBytes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `La imagen supera ${Math.floor(maxImageBytes / (1024 * 1024))}MB.`,
        path: ["fileSizeBytes"],
      });
    }

    if (value.kind === "video" && value.fileSizeBytes > maxVideoBytes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `El vídeo supera ${Math.floor(maxVideoBytes / (1024 * 1024))}MB.`,
        path: ["fileSizeBytes"],
      });
    }
  });

export const assetCommitSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  kind: assetKindSchema,
  contentType: z.string().trim().min(3).max(120),
  storageKey: z.string().trim().min(3).max(500),
  publicUrl: urlSchema,
  fileSize: z.number().int().positive().optional().nullable(),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  durationSeconds: z.number().positive().optional().nullable(),
  altText: z.string().trim().max(240).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(50)).max(12).optional(),
});

export const assetDeleteSchema = z.object({
  id: z.string().uuid(),
});

export const assetListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  kind: assetKindSchema.optional(),
  limit: z.coerce.number().int().min(1).max(300).optional(),
});
