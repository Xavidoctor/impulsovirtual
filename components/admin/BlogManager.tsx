"use client";

import { useEffect, useState } from "react";

import { BlogCategoriesManager } from "@/components/admin/BlogCategoriesManager";
import { BlogPostsManager } from "@/components/admin/BlogPostsManager";
import type { BlogCategoryEntity, BlogPostEntity } from "@/src/types/entities";

type BlogPostWithCategory = BlogPostEntity & {
  category: BlogCategoryEntity | null;
};

export function BlogManager({
  initialCategories,
  initialPosts,
}: {
  initialCategories: BlogCategoryEntity[];
  initialPosts: BlogPostWithCategory[];
}) {
  const [tab, setTab] = useState<"posts" | "categories">("posts");
  const [categories, setCategories] = useState(initialCategories);
  const [posts, setPosts] = useState(initialPosts);
  const [syncToken, setSyncToken] = useState(0);

  async function refreshData() {
    const [categoriesResponse, postsResponse] = await Promise.all([
      fetch("/api/admin/blog/categories", { cache: "no-store" }),
      fetch("/api/admin/blog/posts", { cache: "no-store" }),
    ]);
    const categoriesPayload = await categoriesResponse.json();
    const postsPayload = await postsResponse.json();
    if (!categoriesResponse.ok || !postsResponse.ok) return;

    setCategories(categoriesPayload.data ?? []);
    setPosts(postsPayload.data ?? []);
    setSyncToken((prev) => prev + 1);
  }

  useEffect(() => {
    void refreshData();
  }, [tab]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("posts")}
          className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
            tab === "posts"
              ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-100"
              : "border-white/20 text-neutral-300 hover:bg-white/10"
          }`}
        >
          Posts
        </button>
        <button
          type="button"
          onClick={() => setTab("categories")}
          className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
            tab === "categories"
              ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-100"
              : "border-white/20 text-neutral-300 hover:bg-white/10"
          }`}
        >
          Categorías
        </button>
        <button
          type="button"
          onClick={() => void refreshData()}
          className="rounded-md border border-white/20 px-3 py-1.5 text-sm text-neutral-300 transition-colors hover:bg-white/10"
        >
          Sincronizar
        </button>
      </div>

      {tab === "posts" ? (
        <BlogPostsManager key={`posts-${syncToken}`} initialPosts={posts} categories={categories} />
      ) : (
        <BlogCategoriesManager key={`categories-${syncToken}`} initialItems={categories} />
      )}
    </section>
  );
}
