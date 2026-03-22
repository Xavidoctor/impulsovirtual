// Supabase remains the source of truth for metadata and relations.
// Public media files are stored in Cloudflare R2 using logical key collections.
export const R2_KEY_COLLECTIONS = {
  projects: "projects",
  blog: "blog",
  brand: "brand",
  site: "site",
  proposals: "proposals",
  general: "general",
} as const;

export type R2KeyCollectionName =
  (typeof R2_KEY_COLLECTIONS)[keyof typeof R2_KEY_COLLECTIONS];

// Legacy compatibility constants if a fallback to Supabase Storage is needed.
export const STORAGE_BUCKETS = {
  blogCovers: "blog-covers",
  projectMedia: "project-media",
  brandAssets: "brand-assets",
  siteMedia: "site-media",
  adminPrivate: "admin-private",
  proposalFiles: "proposal-files",
} as const;

export type StorageBucketName =
  (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];
