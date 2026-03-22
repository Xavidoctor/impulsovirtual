import "server-only";

import type { BlogCategoryEntity, BlogPostEntity } from "@/src/types/entities";
import type { Tables, TablesInsert, TablesUpdate } from "@/src/types/database.types";

import { getOptionalDomainClient } from "@/src/lib/domain/client";
import type { DomainSupabaseClient } from "@/src/lib/domain/client";

export type BlogPostWithCategory = BlogPostEntity & {
  category: BlogCategoryEntity | null;
};

type BlogCategoryRow = Tables<"blog_categories">;
type BlogPostRow = Tables<"blog_posts">;
type BlogCategoryInsert = TablesInsert<"blog_categories">;
type BlogCategoryUpdate = TablesUpdate<"blog_categories">;
type BlogPostInsert = TablesInsert<"blog_posts">;
type BlogPostUpdate = TablesUpdate<"blog_posts">;

export type CreateBlogCategoryInput = Omit<
  BlogCategoryInsert,
  "id" | "created_at" | "updated_at"
>;
export type UpdateBlogCategoryInput = Omit<
  BlogCategoryUpdate,
  "id" | "created_at" | "updated_at"
>;
export type CreateBlogPostInput = Omit<BlogPostInsert, "id" | "created_at" | "updated_at">;
export type UpdateBlogPostInput = Omit<BlogPostUpdate, "id" | "created_at" | "updated_at">;

function mapCategoryRow(row: BlogCategoryRow): BlogCategoryEntity {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    sort_order: row.sort_order,
    is_published: Boolean(row.is_published),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapPostRow(row: BlogPostRow): BlogPostEntity {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    cover_image_url: row.cover_image_url,
    category_id: row.category_id,
    author_name: row.author_name,
    is_featured: Boolean(row.is_featured),
    is_published: Boolean(row.is_published),
    published_at: row.published_at,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    og_image_url: row.og_image_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listBlogCategories(
  options: { includeUnpublished?: boolean } = {},
  supabase?: DomainSupabaseClient,
): Promise<BlogCategoryEntity[]> {
  const includeUnpublished = options.includeUnpublished ?? false;
  const db = getOptionalDomainClient(supabase);
  if (!db) return [];

  let query = db
    .from("blog_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (!includeUnpublished) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query;
  if (error) return [];

  return (data ?? []).map(mapCategoryRow);
}

export async function listBlogPosts(
  options: { includeUnpublished?: boolean; limit?: number } = {},
  supabase?: DomainSupabaseClient,
): Promise<BlogPostWithCategory[]> {
  const includeUnpublished = options.includeUnpublished ?? false;
  const db = getOptionalDomainClient(supabase);
  if (!db) return [];

  let query = db
    .from("blog_posts")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (options.limit && options.limit > 0) {
    query = query.limit(options.limit);
  }

  if (!includeUnpublished) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query;
  if (error) return [];

  const posts: BlogPostEntity[] = (data ?? []).map(mapPostRow);
  if (!posts.length) return [];

  const categories = await listBlogCategories({ includeUnpublished: true }, db);
  const categoriesById = new Map(categories.map((category) => [category.id, category]));

  return posts.map((post) => ({
    ...post,
    category: post.category_id ? categoriesById.get(post.category_id) ?? null : null,
  }));
}

export async function getBlogPostBySlug(
  slug: string,
  options: { includeUnpublished?: boolean } = {},
  supabase?: DomainSupabaseClient,
): Promise<BlogPostWithCategory | null> {
  const posts = await listBlogPosts(options, supabase);
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function getBlogCategoryById(
  id: string,
  supabase?: DomainSupabaseClient,
): Promise<BlogCategoryEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db
    .from("blog_categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapCategoryRow(data);
}

export async function createBlogCategory(
  input: CreateBlogCategoryInput,
  supabase?: DomainSupabaseClient,
): Promise<BlogCategoryEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db
    .from("blog_categories")
    .insert(input)
    .select("*")
    .single();

  if (error || !data) return null;
  return mapCategoryRow(data);
}

export async function updateBlogCategoryById(
  id: string,
  input: UpdateBlogCategoryInput,
  supabase?: DomainSupabaseClient,
): Promise<BlogCategoryEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db
    .from("blog_categories")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) return null;
  return mapCategoryRow(data);
}

export async function deleteBlogCategoryById(
  id: string,
  supabase?: DomainSupabaseClient,
): Promise<boolean> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return false;

  const { error: clearPostsError } = await db
    .from("blog_posts")
    .update({ category_id: null })
    .eq("category_id", id);

  if (clearPostsError) return false;

  const { error } = await db.from("blog_categories").delete().eq("id", id);
  return !error;
}

export async function getBlogPostById(
  id: string,
  supabase?: DomainSupabaseClient,
): Promise<BlogPostWithCategory | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db.from("blog_posts").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;

  const post = mapPostRow(data);
  const category = post.category_id
    ? await getBlogCategoryById(post.category_id, db)
    : null;

  return {
    ...post,
    category,
  };
}

export async function createBlogPost(
  input: CreateBlogPostInput,
  supabase?: DomainSupabaseClient,
): Promise<BlogPostEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db.from("blog_posts").insert(input).select("*").single();
  if (error || !data) return null;

  return mapPostRow(data);
}

export async function updateBlogPostById(
  id: string,
  input: UpdateBlogPostInput,
  supabase?: DomainSupabaseClient,
): Promise<BlogPostEntity | null> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return null;

  const { data, error } = await db
    .from("blog_posts")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) return null;
  return mapPostRow(data);
}

export async function deleteBlogPostById(
  id: string,
  supabase?: DomainSupabaseClient,
): Promise<boolean> {
  const db = getOptionalDomainClient(supabase);
  if (!db) return false;

  const { error } = await db.from("blog_posts").delete().eq("id", id);
  return !error;
}
