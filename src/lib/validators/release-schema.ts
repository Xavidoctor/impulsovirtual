import { z } from "zod";

const jsonSchema: z.ZodTypeAny = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonSchema), z.record(jsonSchema)]),
);

export const previewPayloadSchema = z.object({
  path: z.string().trim().min(1).max(240).default("/"),
  enabled: z.boolean().default(true),
  secret: z.string().optional(),
});

export const publishPayloadSchema = z.object({
  label: z.string().trim().min(2).max(140).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const rollbackPayloadSchema = z.object({
  releaseId: z.string().uuid(),
});

export const releaseSnapshotSchema = z.object({
  capturedAt: z.string(),
  siteSections: z.array(jsonSchema),
  siteSettings: z.array(jsonSchema),
  projects: z.array(jsonSchema),
  projectMedia: z.array(jsonSchema),
});
