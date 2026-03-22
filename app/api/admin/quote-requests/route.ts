import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireEditorApi } from "@/src/lib/auth/require-api-role";
import { writeAuditLog } from "@/src/lib/cms/audit";
import {
  listQuoteRequests,
  updateQuoteRequestById,
} from "@/src/lib/domain/quote-requests";
import {
  quoteRequestListQuerySchema,
  quoteRequestUpdateSchema,
} from "@/src/lib/validators/quote-requests-schema";

export async function GET(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  const query = quoteRequestListQuerySchema.parse({
    search: request.nextUrl.searchParams.get("search") ?? undefined,
    status: request.nextUrl.searchParams.get("status") ?? undefined,
  });

  const data = await listQuoteRequests(
    {
      search: query.search,
      status: query.status,
      limit: 250,
    },
    auth.context.supabase,
  );

  return NextResponse.json({
    data,
    meta: { status: "ready", module: "quote_requests" },
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = quoteRequestUpdateSchema.parse(await request.json());
    const { supabase, userId } = auth.context;

    const { data: before, error: loadError } = await (supabase as unknown as {
      from: (table: string) => any;
    })
      .from("quote_requests")
      .select("*")
      .eq("id", payload.id)
      .maybeSingle();

    if (loadError) {
      return NextResponse.json(
        { error: "No se pudo cargar la solicitud." },
        { status: 400 },
      );
    }

    if (!before) {
      return NextResponse.json(
        { error: "Solicitud no encontrada." },
        { status: 404 },
      );
    }

    const data = await updateQuoteRequestById(
      payload.id,
      {
        status: payload.status,
        notes: payload.notes,
      },
      supabase,
    );

    if (!data) {
      return NextResponse.json(
        { error: "No se pudo actualizar la solicitud." },
        { status: 400 },
      );
    }

    await writeAuditLog(supabase, {
      actor_id: userId,
      action: "quote_request.updated",
      entity_type: "quote_request",
      entity_id: data.id,
      before_json: before,
      after_json: data,
    });

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos de actualizacion no validos.", details: error.flatten() },
        { status: 422 },
      );
    }

    return NextResponse.json(
      { error: "Error interno al actualizar la solicitud." },
      { status: 500 },
    );
  }
}

