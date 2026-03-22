import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireEditorApi } from "@/src/lib/auth/require-api-role";
import { writeAuditLog } from "@/src/lib/cms/audit";
import { createFaq, deleteFaqById, listFaqs, updateFaqById } from "@/src/lib/domain/faqs";
import { faqCreateSchema, faqDeleteSchema, faqUpdateSchema } from "@/src/lib/validators/faqs-schema";

export async function GET() {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  const data = await listFaqs({ includeUnpublished: true }, auth.context.supabase);

  return NextResponse.json({
    data,
    meta: { status: "ready", module: "faqs" },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) return auth.response;

  try {
    const payload = faqCreateSchema.parse(await request.json());
    const data = await createFaq(
      {
        category: payload.category ?? null,
        question: payload.question,
        answer: payload.answer,
        sort_order: payload.sort_order,
        is_published: payload.is_published,
      },
      auth.context.supabase,
    );

    if (!data) {
      return NextResponse.json({ error: "No se pudo crear la FAQ." }, { status: 400 });
    }

    await writeAuditLog(auth.context.supabase, {
      actor_id: auth.context.userId,
      action: "faq.created",
      entity_type: "faq",
      entity_id: data.id,
      before_json: null,
      after_json: data,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos de FAQ no válidos.", details: error.flatten() },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: "Error interno al crear FAQ." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) return auth.response;

  try {
    const payload = faqUpdateSchema.parse(await request.json());
    const all = await listFaqs({ includeUnpublished: true }, auth.context.supabase);
    const before = all.find((item) => item.id === payload.id) ?? null;
    if (!before) {
      return NextResponse.json({ error: "FAQ no encontrada." }, { status: 404 });
    }

    const data = await updateFaqById(
      payload.id,
      {
        category: payload.category ?? null,
        question: payload.question,
        answer: payload.answer,
        sort_order: payload.sort_order,
        is_published: payload.is_published,
      },
      auth.context.supabase,
    );

    if (!data) {
      return NextResponse.json({ error: "No se pudo actualizar la FAQ." }, { status: 400 });
    }

    await writeAuditLog(auth.context.supabase, {
      actor_id: auth.context.userId,
      action: "faq.updated",
      entity_type: "faq",
      entity_id: data.id,
      before_json: before,
      after_json: data,
    });

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos de FAQ no válidos.", details: error.flatten() },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: "Error interno al actualizar FAQ." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) return auth.response;

  try {
    const payload = faqDeleteSchema.parse(await request.json());
    const all = await listFaqs({ includeUnpublished: true }, auth.context.supabase);
    const before = all.find((item) => item.id === payload.id) ?? null;
    if (!before) {
      return NextResponse.json({ error: "FAQ no encontrada." }, { status: 404 });
    }

    const ok = await deleteFaqById(payload.id, auth.context.supabase);
    if (!ok) {
      return NextResponse.json({ error: "No se pudo eliminar la FAQ." }, { status: 400 });
    }

    await writeAuditLog(auth.context.supabase, {
      actor_id: auth.context.userId,
      action: "faq.deleted",
      entity_type: "faq",
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
    return NextResponse.json({ error: "Error interno al eliminar FAQ." }, { status: 500 });
  }
}
