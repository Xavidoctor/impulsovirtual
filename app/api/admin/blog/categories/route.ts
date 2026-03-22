import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireEditorApi } from "@/src/lib/auth/require-api-role";
import { writeAuditLog } from "@/src/lib/cms/audit";
import {
  createBlogCategory,
  deleteBlogCategoryById,
  getBlogCategoryById,
  listBlogCategories,
  updateBlogCategoryById,
} from "@/src/lib/domain/blog";
import {
  blogCategoryCreateSchema,
  blogCategoryDeleteSchema,
  blogCategoryUpdateSchema,
} from "@/src/lib/validators/blog-schema";

export async function GET() {
  const auth = await requireEditorApi();
  if (!auth.ok) return auth.response;

  const data = await listBlogCategories({ includeUnpublished: true }, auth.context.supabase);
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) return auth.response;

  try {
    const payload = blogCategoryCreateSchema.parse(await request.json());
    const data = await createBlogCategory(payload, auth.context.supabase);
    if (!data) {
      return NextResponse.json({ error: "No se pudo crear la categoría." }, { status: 400 });
    }

    await writeAuditLog(auth.context.supabase, {
      actor_id: auth.context.userId,
      action: "blog_category.created",
      entity_type: "blog_category",
      entity_id: data.id,
      before_json: null,
      after_json: data,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos de categoría no válidos.", details: error.flatten() },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: "Error interno al crear categoría." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) return auth.response;

  try {
    const payload = blogCategoryUpdateSchema.parse(await request.json());
    const before = await getBlogCategoryById(payload.id, auth.context.supabase);
    if (!before) {
      return NextResponse.json({ error: "Categoría no encontrada." }, { status: 404 });
    }

    const data = await updateBlogCategoryById(
      payload.id,
      {
        slug: payload.slug,
        name: payload.name,
        description: payload.description ?? null,
        sort_order: payload.sort_order,
        is_published: payload.is_published,
      },
      auth.context.supabase,
    );

    if (!data) {
      return NextResponse.json({ error: "No se pudo actualizar la categoría." }, { status: 400 });
    }

    await writeAuditLog(auth.context.supabase, {
      actor_id: auth.context.userId,
      action: "blog_category.updated",
      entity_type: "blog_category",
      entity_id: data.id,
      before_json: before,
      after_json: data,
    });

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos de categoría no válidos.", details: error.flatten() },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: "Error interno al actualizar categoría." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) return auth.response;

  try {
    const payload = blogCategoryDeleteSchema.parse(await request.json());
    const before = await getBlogCategoryById(payload.id, auth.context.supabase);
    if (!before) {
      return NextResponse.json({ error: "Categoría no encontrada." }, { status: 404 });
    }

    const ok = await deleteBlogCategoryById(payload.id, auth.context.supabase);
    if (!ok) {
      return NextResponse.json({ error: "No se pudo eliminar la categoría." }, { status: 400 });
    }

    await writeAuditLog(auth.context.supabase, {
      actor_id: auth.context.userId,
      action: "blog_category.deleted",
      entity_type: "blog_category",
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
    return NextResponse.json({ error: "Error interno al eliminar categoría." }, { status: 500 });
  }
}
