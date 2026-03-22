import { NextResponse } from "next/server";

import { requireEditorApi } from "@/src/lib/auth/require-api-role";
import { listBlogCategories, listBlogPosts } from "@/src/lib/domain/blog";

export async function GET() {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  const [categories, posts] = await Promise.all([
    listBlogCategories({ includeUnpublished: true }, auth.context.supabase),
    listBlogPosts({ includeUnpublished: true }, auth.context.supabase),
  ]);

  return NextResponse.json({
    data: { categories, posts },
    meta: { status: "ready", module: "blog" },
  });
}
