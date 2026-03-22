import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireEditorApi } from "@/src/lib/auth/require-api-role";
import { writeAuditLog } from "@/src/lib/cms/audit";
import {
  createBlogPost,
  deleteBlogPostById,
  getBlogPostById,
  listBlogPosts,
  updateBlogPostById,
} from "@/src/lib/domain/blog";
import {
  blogPostCreateSchema,
  blogPostDeleteSchema,
  blogPostUpdateSchema,
} from "@/src/lib/validators/blog-schema";

function resolvePublishedAt(isPublished: boolean, publishedAt: string | null | undefined) {
  if (!isPublished) return null;
  if (publishedAt) return publishedAt;
  return new Date().toISOString();
}

export async function GET() {
  const auth = await requireEditorApi();
  if (!auth.ok) return auth.response;

  const data = await listBlogPosts({ includeUnpublished: true }, auth.context.supabase);
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) return auth.response;

  try {
    const payload = blogPostCreateSchema.parse(await request.json());
    const data = await createBlogPost(
      {
        slug: payload.slug,
        title: payload.title,
        excerpt: payload.excerpt,
        content: payload.content,
        cover_image_url: payload.cover_image_url ?? null,
        category_id: payload.category_id ?? null,
        author_name: payload.author_name ?? null,
        is_featured: payload.is_featured,
        is_published: payload.is_published,
        published_at: resolvePublishedAt(payload.is_published, payload.published_at),
        seo_title: payload.seo_title ?? null,
        seo_description: payload.seo_description ?? null,
        og_image_url: payload.og_image_url ?? null,
      },
      auth.context.supabase,
    );
    if (!data) {
      return NextResponse.json({ error: "No se pudo crear el post." }, { status: 400 });
    }

    await writeAuditLog(auth.context.supabase, {
      actor_id: auth.context.userId,
      action: "blog_post.created",
      entity_type: "blog_post",
      entity_id: data.id,
      before_json: null,
      after_json: data,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos del post no válidos.", details: error.flatten() },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: "Error interno al crear el post." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) return auth.response;

  try {
    const payload = blogPostUpdateSchema.parse(await request.json());
    const before = await getBlogPostById(payload.id, auth.context.supabase);
    if (!before) {
      return NextResponse.json({ error: "Post no encontrado." }, { status: 404 });
    }

    const data = await updateBlogPostById(
      payload.id,
      {
        slug: payload.slug,
        title: payload.title,
        excerpt: payload.excerpt,
        content: payload.content,
        cover_image_url: payload.cover_image_url ?? null,
        category_id: payload.category_id ?? null,
        author_name: payload.author_name ?? null,
        is_featured: payload.is_featured,
        is_published: payload.is_published,
        published_at: resolvePublishedAt(payload.is_published, payload.published_at),
        seo_title: payload.seo_title ?? null,
        seo_description: payload.seo_description ?? null,
        og_image_url: payload.og_image_url ?? null,
      },
      auth.context.supabase,
    );

    if (!data) {
      return NextResponse.json({ error: "No se pudo actualizar el post." }, { status: 400 });
    }

    await writeAuditLog(auth.context.supabase, {
      actor_id: auth.context.userId,
      action: "blog_post.updated",
      entity_type: "blog_post",
      entity_id: data.id,
      before_json: before,
      after_json: data,
    });

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos del post no válidos.", details: error.flatten() },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: "Error interno al actualizar el post." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) return auth.response;

  try {
    const payload = blogPostDeleteSchema.parse(await request.json());
    const before = await getBlogPostById(payload.id, auth.context.supabase);
    if (!before) {
      return NextResponse.json({ error: "Post no encontrado." }, { status: 404 });
    }

    const ok = await deleteBlogPostById(payload.id, auth.context.supabase);
    if (!ok) {
      return NextResponse.json({ error: "No se pudo eliminar el post." }, { status: 400 });
    }

    await writeAuditLog(auth.context.supabase, {
      actor_id: auth.context.userId,
      action: "blog_post.deleted",
      entity_type: "blog_post",
      entity_id: payload.id,
      before_json: before,
      after_json: null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Solicitud no válida.", details: error.flatten() },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: "Error interno al eliminar el post." }, { status: 500 });
  }
}
