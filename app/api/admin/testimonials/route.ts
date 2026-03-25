import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireEditorApi } from "@/src/lib/auth/require-api-role";
import { writeAuditLog } from "@/src/lib/cms/audit";
import {
  createTestimonial,
  deleteTestimonialById,
  listTestimonials,
  updateTestimonialById,
} from "@/src/lib/domain/testimonials";
import {
  testimonialCreateSchema,
  testimonialDeleteSchema,
  testimonialUpdateSchema,
} from "@/src/lib/validators/testimonials-schema";

function revalidateTestimonialViews() {
  revalidateTag("testimonials");
  revalidatePath("/");
}

export async function GET() {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  const data = await listTestimonials({ includeUnpublished: true }, auth.context.supabase);

  return NextResponse.json({
    data,
    meta: { status: "ready", module: "testimonials" },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) return auth.response;

  try {
    const payload = testimonialCreateSchema.parse(await request.json());
    const data = await createTestimonial(
      {
        name: payload.name,
        company: payload.company ?? null,
        role: payload.role ?? null,
        quote: payload.quote,
        avatar_url: payload.avatar_url ?? null,
        sort_order: payload.sort_order,
        is_featured: payload.is_featured,
        is_published: payload.is_published,
      },
      auth.context.supabase,
    );

    if (!data) {
      return NextResponse.json({ error: "No se pudo crear el testimonio." }, { status: 400 });
    }

    await writeAuditLog(auth.context.supabase, {
      actor_id: auth.context.userId,
      action: "testimonial.created",
      entity_type: "testimonial",
      entity_id: data.id,
      before_json: null,
      after_json: data,
    });

    revalidateTestimonialViews();

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos del testimonio no válidos.", details: error.flatten() },
        { status: 422 },
      );
    }

    return NextResponse.json({ error: "Error interno al crear testimonio." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) return auth.response;

  try {
    const payload = testimonialUpdateSchema.parse(await request.json());
    const all = await listTestimonials({ includeUnpublished: true }, auth.context.supabase);
    const before = all.find((item) => item.id === payload.id) ?? null;
    if (!before) {
      return NextResponse.json({ error: "Testimonio no encontrado." }, { status: 404 });
    }

    const data = await updateTestimonialById(
      payload.id,
      {
        name: payload.name,
        company: payload.company ?? null,
        role: payload.role ?? null,
        quote: payload.quote,
        avatar_url: payload.avatar_url ?? null,
        sort_order: payload.sort_order,
        is_featured: payload.is_featured,
        is_published: payload.is_published,
      },
      auth.context.supabase,
    );

    if (!data) {
      return NextResponse.json({ error: "No se pudo actualizar el testimonio." }, { status: 400 });
    }

    await writeAuditLog(auth.context.supabase, {
      actor_id: auth.context.userId,
      action: "testimonial.updated",
      entity_type: "testimonial",
      entity_id: data.id,
      before_json: before,
      after_json: data,
    });

    revalidateTestimonialViews();

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos del testimonio no válidos.", details: error.flatten() },
        { status: 422 },
      );
    }

    return NextResponse.json({ error: "Error interno al actualizar testimonio." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) return auth.response;

  try {
    const payload = testimonialDeleteSchema.parse(await request.json());
    const all = await listTestimonials({ includeUnpublished: true }, auth.context.supabase);
    const before = all.find((item) => item.id === payload.id) ?? null;
    if (!before) {
      return NextResponse.json({ error: "Testimonio no encontrado." }, { status: 404 });
    }

    const ok = await deleteTestimonialById(payload.id, auth.context.supabase);
    if (!ok) {
      return NextResponse.json({ error: "No se pudo eliminar el testimonio." }, { status: 400 });
    }

    await writeAuditLog(auth.context.supabase, {
      actor_id: auth.context.userId,
      action: "testimonial.deleted",
      entity_type: "testimonial",
      entity_id: payload.id,
      before_json: before,
      after_json: null,
    });

    revalidateTestimonialViews();

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Solicitud no válida.", details: error.flatten() },
        { status: 422 },
      );
    }

    return NextResponse.json({ error: "Error interno al eliminar testimonio." }, { status: 500 });
  }
}
