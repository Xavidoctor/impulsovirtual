import { NextRequest, NextResponse } from "next/server";

import { requireEditorApi } from "@/src/lib/auth/require-api-role";
import { writeAuditLog } from "@/src/lib/cms/audit";
import {
  createProject,
  deleteProjectById,
  getProjectById,
  listProjectMedia,
  listProjects,
  updateProject,
} from "@/src/lib/cms/queries";
import {
  projectCreateSchema,
  projectDeleteSchema,
  projectGetQuerySchema,
  projectUpdateSchema,
} from "@/src/lib/validators/project-schema";

export async function GET(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  const query = projectGetQuerySchema.parse({
    id: request.nextUrl.searchParams.get("id") ?? undefined,
    status: request.nextUrl.searchParams.get("status") ?? undefined,
    search: request.nextUrl.searchParams.get("search") ?? undefined,
  });

  if (query.id) {
    const [{ data: project, error: projectError }, { data: media, error: mediaError }] =
      await Promise.all([
        getProjectById(auth.context.supabase, query.id),
        listProjectMedia(auth.context.supabase, query.id),
      ]);

    if (projectError) {
      return NextResponse.json({ error: "No se pudo cargar el proyecto." }, { status: 400 });
    }

    if (mediaError) {
      return NextResponse.json({ error: "No se pudo cargar la media del proyecto." }, { status: 400 });
    }

    return NextResponse.json({ data: project, media: media ?? [] });
  }

  const { data, error } = await listProjects(auth.context.supabase, {
    status: query.status,
    search: query.search,
  });

  if (error) {
    return NextResponse.json({ error: "No se pudieron cargar los proyectos." }, { status: 400 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  const payload = projectCreateSchema.parse(await request.json());

  const { data, error } = await createProject(auth.context.supabase, {
    slug: payload.slug.toLowerCase(),
    title: payload.title,
    subtitle: payload.subtitle ?? null,
    excerpt: payload.excerpt ?? null,
    body_markdown: payload.bodyMarkdown ?? null,
    year: payload.year ?? null,
    client_name: payload.clientName ?? null,
    category: payload.category ?? null,
    featured: payload.featured,
    status: payload.status,
    seo_json: payload.seoJson,
    published_at: payload.publishedAt ?? null,
    updated_by: auth.context.userId,
  });

  if (error) {
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
}

export async function PUT(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  const payload = projectUpdateSchema.parse(await request.json());

  const { data: before } = await getProjectById(auth.context.supabase, payload.id);

  const { data, error } = await updateProject(auth.context.supabase, payload.id, {
    slug: payload.slug.toLowerCase(),
    title: payload.title,
    subtitle: payload.subtitle ?? null,
    excerpt: payload.excerpt ?? null,
    body_markdown: payload.bodyMarkdown ?? null,
    year: payload.year ?? null,
    client_name: payload.clientName ?? null,
    category: payload.category ?? null,
    featured: payload.featured,
    status: payload.status,
    seo_json: payload.seoJson,
    published_at: payload.publishedAt ?? null,
    updated_by: auth.context.userId,
  });

  if (error) {
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
}

export async function DELETE(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  const payload = projectDeleteSchema.parse(await request.json());
  const { data: before } = await getProjectById(auth.context.supabase, payload.id);

  const { error } = await deleteProjectById(auth.context.supabase, payload.id);
  if (error) {
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
}
