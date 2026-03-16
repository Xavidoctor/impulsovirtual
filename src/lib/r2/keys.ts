import "server-only";
import { createHash } from "crypto";

function cleanFilename(filename: string) {
  return filename
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export function buildProjectMediaStorageKey(params: {
  projectId?: string;
  kind: "image" | "video";
  filename: string;
}) {
  const safeFilename = cleanFilename(params.filename) || "asset";
  const datePart = new Date().toISOString().slice(0, 10);
  const randomPart = crypto.randomUUID().slice(0, 8);
  const projectPart = params.projectId ?? "unassigned";

  return `projects/${projectPart}/${params.kind}/${datePart}-${randomPart}-${safeFilename}`;
}

function slugifyText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function buildDeterministicMediaStorageKey(params: {
  scope: "manual" | "legacy";
  projectRef: string;
  role: "cover" | "hero" | "gallery" | "detail";
  kind: "image" | "video";
  source: string;
  index?: number;
}) {
  const digest = createHash("sha1").update(params.source).digest("hex").slice(0, 12);
  const projectSlug = slugifyText(params.projectRef) || "project";
  const indexPart = typeof params.index === "number" ? `${String(params.index).padStart(2, "0")}-` : "";

  return `${params.scope}/projects/${projectSlug}/${params.role}/${params.kind}/${indexPart}${digest}`;
}
