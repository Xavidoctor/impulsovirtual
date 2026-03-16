import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireEditorApi } from "@/src/lib/auth/require-api-role";
import { writeAuditLog } from "@/src/lib/cms/audit";
import {
  deleteSectionById,
  listSections,
  updateSectionById,
  upsertSection,
} from "@/src/lib/cms/queries";
import {
  parseSectionData,
  sectionDeleteSchema,
  sectionStatusSchema,
  sectionUpsertSchema,
} from "@/src/lib/validators/section-schemas";

const listSectionsQuerySchema = z.object({
  pageKey: z.string().optional(),
  status: sectionStatusSchema.optional(),
});

async function handleUpsert(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  const payload = sectionUpsertSchema.parse(await request.json());
  const parsedData = parseSectionData(payload.sectionKey, payload.dataJson);
  const { supabase, userId } = auth.context;

  if (payload.id) {
    const { data: before } = await supabase
      .from("site_sections")
      .select("*")
      .eq("id", payload.id)
      .maybeSingle();

    const { data, error } = await updateSectionById(supabase, payload.id, {
      page_key: payload.pageKey,
      section_key: payload.sectionKey,
      position: payload.position,
      enabled: payload.enabled,
      status: payload.status,
      data_json: parsedData,
      updated_by: userId,
    });

    if (error) {
      return NextResponse.json(
        { error: "No se pudo actualizar la seccion." },
        { status: 400 },
      );
    }

    await writeAuditLog(supabase, {
      actor_id: userId,
      action: "section.updated",
      entity_type: "site_section",
      entity_id: data.id,
      before_json: before,
      after_json: data,
    });

    return NextResponse.json({ data });
  }

  const { data, error } = await upsertSection(supabase, {
    page_key: payload.pageKey,
    section_key: payload.sectionKey,
    position: payload.position,
    enabled: payload.enabled,
    status: payload.status,
    data_json: parsedData,
    updated_by: userId,
  });

  if (error) {
    return NextResponse.json({ error: "No se pudo guardar la seccion." }, { status: 400 });
  }

  await writeAuditLog(supabase, {
    actor_id: userId,
    action: "section.created_or_upserted",
    entity_type: "site_section",
    entity_id: data.id,
    before_json: null,
    after_json: data,
  });

  return NextResponse.json({ data }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  const parsedQuery = listSectionsQuerySchema.parse({
    pageKey: request.nextUrl.searchParams.get("pageKey") ?? undefined,
    status: request.nextUrl.searchParams.get("status") ?? undefined,
  });

  const { data, error } = await listSections(
    auth.context.supabase,
    parsedQuery.pageKey,
    parsedQuery.status,
  );

  if (error) {
    return NextResponse.json({ error: "No se pudieron cargar las secciones." }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  return handleUpsert(request);
}

export async function PUT(request: NextRequest) {
  return handleUpsert(request);
}

export async function DELETE(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  const payload = sectionDeleteSchema.parse(await request.json());
  const { supabase, userId } = auth.context;

  const { data: before } = await supabase
    .from("site_sections")
    .select("*")
    .eq("id", payload.id)
    .maybeSingle();

  const { error } = await deleteSectionById(supabase, payload.id);

  if (error) {
    return NextResponse.json({ error: "No se pudo eliminar la seccion." }, { status: 400 });
  }

  await writeAuditLog(supabase, {
    actor_id: userId,
    action: "section.deleted",
    entity_type: "site_section",
    entity_id: payload.id,
    before_json: before,
    after_json: null,
  });

  return NextResponse.json({ success: true });
}
