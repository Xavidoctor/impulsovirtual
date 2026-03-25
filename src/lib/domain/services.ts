import "server-only";

import { unstable_cache } from "next/cache";

import type { ServiceEntity } from "@/src/types/entities";
import type { Tables, TablesInsert, TablesUpdate } from "@/src/types/database.types";

import { getOptionalDomainClient } from "@/src/lib/domain/client";
import type { DomainSupabaseClient } from "@/src/lib/domain/client";

type ServiceRow = Tables<"services">;
type ServiceInsert = TablesInsert<"services">;
type ServiceUpdate = TablesUpdate<"services">;

export type CreateServiceInput = Omit<ServiceInsert, "id" | "created_at" | "updated_at">;
export type UpdateServiceInput = Omit<ServiceUpdate, "id" | "created_at" | "updated_at">;

type FeaturedServicesOptions = {
  limit?: number;
};

function mapServiceRow(row: ServiceRow): ServiceEntity {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    short_description: row.short_description,
    full_description: row.full_description,
    cover_image_url: row.cover_image_url,
    icon_name: row.icon_name,
    featured: Boolean(row.featured),
    sort_order: row.sort_order,
    is_published: row.is_published,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

type ListServicesOptions = {
  includeUnpublished?: boolean;
};

function dedupeServices(services: ServiceEntity[]): ServiceEntity[] {
  const seen = new Set<string>();
  return services.filter((service) => {
    const key = service.id || service.slug;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function listServices(
  options: ListServicesOptions = {},
  supabase?: DomainSupabaseClient,
): Promise<ServiceEntity[]> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return [];
  const includeUnpublished = options.includeUnpublished ?? false;

  let query = db
    .from("services")
    .select("*")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (!includeUnpublished) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query;
  if (error) return [];

  return (data ?? []).map(mapServiceRow);
}

async function listPublishedServicesFromDb(supabase?: DomainSupabaseClient): Promise<ServiceEntity[]> {
  const services = await listServices({ includeUnpublished: false }, supabase);
  return dedupeServices(services);
}

const listPublishedServicesCached = unstable_cache(
  async () => listPublishedServicesFromDb(),
  ["services-published"],
  { tags: ["services"] },
);

export async function listPublishedServices(supabase?: DomainSupabaseClient): Promise<ServiceEntity[]> {
  if (supabase) {
    return listPublishedServicesFromDb(supabase);
  }

  return listPublishedServicesCached();
}

async function listFeaturedPublishedServicesFromDb(
  supabase?: DomainSupabaseClient,
): Promise<ServiceEntity[]> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return [];

  const { data, error } = await db
    .from("services")
    .select("*")
    .eq("is_published", true)
    .eq("featured", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return [];

  return dedupeServices((data ?? []).map(mapServiceRow));
}

const listFeaturedPublishedServicesCached = unstable_cache(
  async () => listFeaturedPublishedServicesFromDb(),
  ["services-featured-published"],
  { tags: ["services"] },
);

export async function listFeaturedPublishedServices(
  options: FeaturedServicesOptions = {},
  supabase?: DomainSupabaseClient,
): Promise<ServiceEntity[]> {
  const services = supabase
    ? await listFeaturedPublishedServicesFromDb(supabase)
    : await listFeaturedPublishedServicesCached();

  if (typeof options.limit === "number" && Number.isFinite(options.limit)) {
    return services.slice(0, Math.max(0, options.limit));
  }

  return services;
}

async function getServiceBySlugFromDb(
  slug: string,
  includeUnpublished: boolean,
  supabase?: DomainSupabaseClient,
): Promise<ServiceEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  let query = db.from("services").select("*").eq("slug", slug);
  if (!includeUnpublished) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;

  return mapServiceRow(data);
}

const getPublishedServiceBySlugCached = unstable_cache(
  async (slug: string) => getServiceBySlugFromDb(slug, false),
  ["services-by-slug"],
  { tags: ["services"] },
);

export async function getServiceBySlug(
  slug: string,
  options: ListServicesOptions = {},
  supabase?: DomainSupabaseClient,
): Promise<ServiceEntity | null> {
  const includeUnpublished = options.includeUnpublished ?? false;

  if (!includeUnpublished && !supabase) {
    return getPublishedServiceBySlugCached(slug);
  }

  return getServiceBySlugFromDb(slug, includeUnpublished, supabase);
}

export async function getServiceById(
  id: string,
  supabase?: DomainSupabaseClient,
): Promise<ServiceEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db.from("services").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;

  return mapServiceRow(data);
}

export async function createService(
  input: CreateServiceInput,
  supabase?: DomainSupabaseClient,
): Promise<ServiceEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db.from("services").insert(input).select("*").single();
  if (error || !data) return null;

  return mapServiceRow(data);
}

export async function updateServiceById(
  id: string,
  input: UpdateServiceInput,
  supabase?: DomainSupabaseClient,
): Promise<ServiceEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db.from("services").update(input).eq("id", id).select("*").single();
  if (error || !data) return null;

  return mapServiceRow(data);
}

export async function deleteServiceById(
  id: string,
  supabase?: DomainSupabaseClient,
): Promise<boolean> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return false;

  const { error } = await db.from("services").delete().eq("id", id);
  return !error;
}
