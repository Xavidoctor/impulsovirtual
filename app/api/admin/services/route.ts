import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireEditorApi } from "@/src/lib/auth/require-api-role";
import { writeAuditLog } from "@/src/lib/cms/audit";
import {
  createService,
  deleteServiceById,
  getServiceById,
  listServices,
  updateServiceById,
} from "@/src/lib/domain/services";
import {
  serviceCreateSchema,
  serviceDeleteSchema,
  serviceUpdateSchema,
} from "@/src/lib/validators/services-schema";

export async function GET() {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  const data = await listServices({ includeUnpublished: true }, auth.context.supabase);

  return NextResponse.json({
    data,
    meta: { status: "ready", module: "services" },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = serviceCreateSchema.parse(await request.json());
    const data = await createService(payload, auth.context.supabase);

    if (!data) {
      return NextResponse.json({ error: "No se pudo crear el servicio." }, { status: 400 });
    }

    await writeAuditLog(auth.context.supabase, {
      actor_id: auth.context.userId,
      action: "service.created",
      entity_type: "service",
      entity_id: data.id,
      before_json: null,
      after_json: data,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos de servicio no válidos.", details: error.flatten() },
        { status: 422 },
      );
    }

    return NextResponse.json({ error: "Error interno al crear el servicio." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = serviceUpdateSchema.parse(await request.json());
    const before = await getServiceById(payload.id, auth.context.supabase);

    if (!before) {
      return NextResponse.json({ error: "Servicio no encontrado." }, { status: 404 });
    }

    const data = await updateServiceById(
      payload.id,
      {
        slug: payload.slug,
        title: payload.title,
        subtitle: payload.subtitle ?? null,
        short_description: payload.short_description,
        full_description: payload.full_description,
        cover_image_url: payload.cover_image_url ?? null,
        icon_name: payload.icon_name ?? null,
        featured: payload.featured,
        sort_order: payload.sort_order,
        is_published: payload.is_published,
        seo_title: payload.seo_title ?? null,
        seo_description: payload.seo_description ?? null,
      },
      auth.context.supabase,
    );

    if (!data) {
      return NextResponse.json({ error: "No se pudo actualizar el servicio." }, { status: 400 });
    }

    await writeAuditLog(auth.context.supabase, {
      actor_id: auth.context.userId,
      action: "service.updated",
      entity_type: "service",
      entity_id: data.id,
      before_json: before,
      after_json: data,
    });

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos de servicio no válidos.", details: error.flatten() },
        { status: 422 },
      );
    }

    return NextResponse.json(
      { error: "Error interno al actualizar el servicio." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = serviceDeleteSchema.parse(await request.json());
    const before = await getServiceById(payload.id, auth.context.supabase);

    if (!before) {
      return NextResponse.json({ error: "Servicio no encontrado." }, { status: 404 });
    }

    const ok = await deleteServiceById(payload.id, auth.context.supabase);
    if (!ok) {
      return NextResponse.json({ error: "No se pudo eliminar el servicio." }, { status: 400 });
    }

    await writeAuditLog(auth.context.supabase, {
      actor_id: auth.context.userId,
      action: "service.deleted",
      entity_type: "service",
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

    return NextResponse.json({ error: "Error interno al eliminar el servicio." }, { status: 500 });
  }
}
