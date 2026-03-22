import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireEditorApi } from "@/src/lib/auth/require-api-role";
import { writeAuditLog } from "@/src/lib/cms/audit";
import {
  deleteProjectById,
  getProjectById,
  listProjects,
  createProject,
  updateProjectById,
} from "@/src/lib/domain/projects";
import {
  projectListQuerySchema,
  projectCreateSchema,
  projectUpdateSchema,
  projectDeleteSchema,
} from "@/src/lib/validators/project-schema";

function resolvePublishedAt(isPublished: boolean, publishedAt: string | null | undefined) {
  if (!isPublished) return null;
  if (publishedAt) return publishedAt;
  return new Date().toISOString();
}

export async function GET(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  const query = projectListQuerySchema.parse({
    id: request.nextUrl.searchParams.get("id") ?? undefined,
    search: request.nextUrl.searchParams.get("search") ?? undefined,
    includeUnpublished:
      request.nextUrl.searchParams.get("includeUnpublished") ?? undefined,
  });

  if (query.id) {
    const [project, mediaResult] =
      await Promise.all([
        getProjectById(query.id, { includeMedia: false }, auth.context.supabase),
        auth.context.supabase
          .from("project_media")
          .select("*")
          .eq("project_id", query.id)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);

    if (!project) {
      return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ data: project, media: mediaResult.data ?? [] });
  }

  const data = await listProjects(
    {
      includeUnpublished: query.includeUnpublished ?? true,
      includeMedia: false,
    },
    auth.context.supabase,
  );

  const search = query.search?.trim().toLowerCase();
  const filtered = search
    ? data.filter((project) =>
        `${project.title} ${project.slug} ${project.client_name ?? ""} ${project.excerpt ?? ""}`
          .toLowerCase()
          .includes(search),
      )
    : data;

  return NextResponse.json({ data: filtered });
}

export async function POST(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = projectCreateSchema.parse(await request.json());
    const data = await createProject(
      {
        slug: payload.slug,
        title: payload.title,
        client_name: payload.client_name ?? null,
        excerpt: payload.excerpt ?? "",
        description: payload.description ?? null,
        challenge: payload.challenge ?? null,
        solution: payload.solution ?? null,
        results: payload.results ?? null,
        cover_image_url: payload.cover_image_url ?? null,
        company_logo_url: payload.company_logo_url ?? null,
        website_url: payload.live_url ?? payload.website_url ?? null,
        live_url: payload.live_url ?? payload.website_url ?? null,
        featured: payload.featured,
        status: payload.status,
        progress_percentage:
          payload.status === "in_progress" ? payload.progress_percentage ?? null : null,
        progress_label: payload.status === "in_progress" ? payload.progress_label ?? null : null,
        progress_note: payload.status === "in_progress" ? payload.progress_note ?? null : null,
        project_orientation: payload.project_orientation ?? null,
        what_was_done: payload.what_was_done ?? null,
        services_applied: payload.services_applied ?? [],
        preview_mode: payload.preview_mode,
        preview_image_url: payload.preview_image_url ?? null,
        is_published: payload.is_published,
        published_at: resolvePublishedAt(payload.is_published, payload.published_at),
        seo_title: payload.seo_title ?? null,
        seo_description: payload.seo_description ?? null,
      },
      auth.context.supabase,
    );

    if (!data) {
      return NextResponse.json({ error: "No se pudo crear el proyecto." }, { status: 400 });
    }

    await writeAuditLog(auth.context.supabase, {
      actor_id: auth.context.userId,
      action: "project.created",
      entity_type: "project",
      entity_id: data.id,
      before_json: null,
      after_json: data,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos de proyecto no válidos.", details: error.flatten() },
        { status: 422 },
      );
    }

    return NextResponse.json({ error: "Error interno al crear el proyecto." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = projectUpdateSchema.parse(await request.json());

    const before = await getProjectById(payload.id, { includeMedia: false }, auth.context.supabase);
    if (!before) {
      return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
    }

    const data = await updateProjectById(
      payload.id,
      {
        slug: payload.slug,
        title: payload.title,
        client_name: payload.client_name ?? null,
        excerpt: payload.excerpt ?? "",
        description: payload.description ?? null,
        challenge: payload.challenge ?? null,
        solution: payload.solution ?? null,
        results: payload.results ?? null,
        cover_image_url: payload.cover_image_url ?? null,
        company_logo_url: payload.company_logo_url ?? null,
        website_url: payload.live_url ?? payload.website_url ?? null,
        live_url: payload.live_url ?? payload.website_url ?? null,
        featured: payload.featured,
        status: payload.status,
        progress_percentage:
          payload.status === "in_progress" ? payload.progress_percentage ?? null : null,
        progress_label: payload.status === "in_progress" ? payload.progress_label ?? null : null,
        progress_note: payload.status === "in_progress" ? payload.progress_note ?? null : null,
        project_orientation: payload.project_orientation ?? null,
        what_was_done: payload.what_was_done ?? null,
        services_applied: payload.services_applied ?? [],
        preview_mode: payload.preview_mode,
        preview_image_url: payload.preview_image_url ?? null,
        is_published: payload.is_published,
        published_at: resolvePublishedAt(payload.is_published, payload.published_at),
        seo_title: payload.seo_title ?? null,
        seo_description: payload.seo_description ?? null,
      },
      auth.context.supabase,
    );

    if (!data) {
      return NextResponse.json({ error: "No se pudo actualizar el proyecto." }, { status: 400 });
    }

    await writeAuditLog(auth.context.supabase, {
      actor_id: auth.context.userId,
      action: "project.updated",
      entity_type: "project",
      entity_id: data.id,
      before_json: before,
      after_json: data,
    });

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos de proyecto no válidos.", details: error.flatten() },
        { status: 422 },
      );
    }

    return NextResponse.json({ error: "Error interno al actualizar el proyecto." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = projectDeleteSchema.parse(await request.json());
    const before = await getProjectById(payload.id, { includeMedia: false }, auth.context.supabase);

    if (!before) {
      return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
    }

    const ok = await deleteProjectById(payload.id, auth.context.supabase);
    if (!ok) {
      return NextResponse.json({ error: "No se pudo eliminar el proyecto." }, { status: 400 });
    }

    await writeAuditLog(auth.context.supabase, {
      actor_id: auth.context.userId,
      action: "project.deleted",
      entity_type: "project",
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

    return NextResponse.json({ error: "Error interno al eliminar el proyecto." }, { status: 500 });
  }
}
