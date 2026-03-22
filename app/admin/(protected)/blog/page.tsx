import { BlogManager } from "@/components/admin/BlogManager";
import { requireEditorPage } from "@/src/lib/auth/require-page-role";
import { listBlogCategories, listBlogPosts } from "@/src/lib/domain/blog";

export default async function AdminBlogPage() {
  const { supabase } = await requireEditorPage();
  const [categories, posts] = await Promise.all([
    listBlogCategories({ includeUnpublished: true }, supabase),
    listBlogPosts({ includeUnpublished: true }, supabase),
  ]);

  return <BlogManager initialCategories={categories} initialPosts={posts} />;
}
