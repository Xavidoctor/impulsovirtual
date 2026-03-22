export type CmsAssetLogicalCollection =
  | "projects"
  | "blog"
  | "brand"
  | "site"
  | "proposals"
  | "general";

export type CmsAssetStorageProvider = "r2" | "supabase" | "external";

export function inferAssetCollectionFromStorageKey(storageKey: string): CmsAssetLogicalCollection {
  const normalized = storageKey.toLowerCase();
  if (normalized.startsWith("projects/")) return "projects";
  if (normalized.startsWith("blog/")) return "blog";
  if (normalized.startsWith("brand/")) return "brand";
  if (normalized.startsWith("site/")) return "site";
  if (normalized.startsWith("proposals/")) return "proposals";
  return "general";
}

export function inferAssetStorageProvider(storageKey: string, publicUrl: string): CmsAssetStorageProvider {
  const normalizedKey = storageKey.toLowerCase();
  if (normalizedKey.startsWith("manual/") || normalizedKey.startsWith("legacy/")) {
    return "external";
  }

  if (normalizedKey.startsWith("supabase/")) {
    return "supabase";
  }

  if (publicUrl.startsWith("/")) {
    return "external";
  }

  return "r2";
}

export function inferAssetBucketName(provider: CmsAssetStorageProvider): string {
  if (provider === "r2") return "r2-public";
  if (provider === "supabase") return "supabase-public";
  return "external";
}
