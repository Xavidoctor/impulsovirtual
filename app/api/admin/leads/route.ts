import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireEditorApi } from "@/src/lib/auth/require-api-role";
import { writeAuditLog } from "@/src/lib/cms/audit";
import { listLeads, updateLeadById } from "@/src/lib/domain/leads";
import { leadListQuerySchema, leadUpdateSchema } from "@/src/lib/validators/leads-schema";

export async function GET(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  const query = leadListQuerySchema.parse({
    search: request.nextUrl.searchParams.get("search") ?? undefined,
    status: request.nextUrl.searchParams.get("status") ?? undefined,
  });

  const data = await listLeads(
    {
      search: query.search,
      status: query.status,
      limit: 250,
    },
    auth.context.supabase,
  );

  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = leadUpdateSchema.parse(await request.json());
    const { supabase, userId } = auth.context;

    const { data: before, error: loadError } = await (supabase as unknown as { from: (table: string) => any })
      .from("leads")
      .select("*")
      .eq("id", payload.id)
      .maybeSingle();

    if (loadError) {
      return NextResponse.json({ error: "No se pudo cargar el lead." }, { status: 400 });
    }

    if (!before) {
      return NextResponse.json({ error: "Lead no encontrado." }, { status: 404 });
    }

    const data = await updateLeadById(
      payload.id,
      {
        status: payload.status,
        notes: payload.notes,
      },
      supabase,
    );

    if (!data) {
      return NextResponse.json({ error: "No se pudo actualizar el lead." }, { status: 400 });
    }

    await writeAuditLog(supabase, {
      actor_id: userId,
      action: "lead.updated",
      entity_type: "lead",
      entity_id: data.id,
      before_json: before,
      after_json: data,
    });

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos de actualización no válidos.", details: error.flatten() },
        { status: 422 },
      );
    }

    return NextResponse.json({ error: "Error interno al actualizar el lead." }, { status: 500 });
  }
}
