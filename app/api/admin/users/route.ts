import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireAdminApi } from "@/src/lib/auth/require-api-role";
import { writeAuditLog } from "@/src/lib/cms/audit";
import {
  adminUserListQuerySchema,
  adminUserUpdateSchema,
} from "@/src/lib/validators/users-schema";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return auth.response;
  }

  const query = adminUserListQuerySchema.parse({
    search: request.nextUrl.searchParams.get("search") ?? undefined,
  });

  let dbQuery = auth.context.supabase
    .from("admin_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (query.search) {
    const term = query.search.replace(/[%_]/g, "").trim();
    if (term) {
      dbQuery = dbQuery.or(`email.ilike.%${term}%,full_name.ilike.%${term}%`);
    }
  }

  const { data, error } = await dbQuery;
  if (error) {
    return NextResponse.json({ error: "No se pudieron cargar los usuarios." }, { status: 400 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = adminUserUpdateSchema.parse(await request.json());
    const { supabase, userId } = auth.context;

    const { data: before, error: loadError } = await supabase
      .from("admin_profiles")
      .select("*")
      .eq("id", payload.id)
      .maybeSingle();

    if (loadError) {
      return NextResponse.json({ error: "No se pudo cargar el usuario." }, { status: 400 });
    }

    if (!before) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    }

    const isSelf =
      payload.id === userId ||
      (before as { user_id?: string | null }).user_id === userId;

    if (isSelf && payload.isActive === false) {
      return NextResponse.json(
        { error: "No puedes desactivar tu propio acceso." },
        { status: 422 },
      );
    }

    const nextPatch: { role?: "admin" | "editor"; is_active?: boolean } = {};
    if (payload.role !== undefined) {
      nextPatch.role = payload.role;
    }
    if (payload.isActive !== undefined) {
      nextPatch.is_active = payload.isActive;
    }

    const { data, error } = await supabase
      .from("admin_profiles")
      .update(nextPatch)
      .eq("id", payload.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: "No se pudo actualizar el usuario." }, { status: 400 });
    }

    await writeAuditLog(supabase, {
      actor_id: userId,
      action: "admin_profile.updated",
      entity_type: "admin_profile",
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

    return NextResponse.json({ error: "Error interno al actualizar el usuario." }, { status: 500 });
  }
}
