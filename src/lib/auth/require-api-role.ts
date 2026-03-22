import "server-only";

import { NextResponse } from "next/server";

import { hasRequiredRole, type AdminRole } from "@/src/lib/auth/roles";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

type ApiAuthSuccess = {
  ok: true;
  context: {
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
    userId: string;
    role: AdminRole;
  };
};

type ApiAuthFailure = {
  ok: false;
  response: NextResponse;
};

export async function requireApiRole(
  minimumRole: AdminRole,
): Promise<ApiAuthSuccess | ApiAuthFailure> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No autorizado" },
        { status: 401 },
      ),
    };
  }

  const db = supabase as unknown as { from: (table: string) => any };
  let profileResult = await db
    .from("admin_profiles")
    .select("id, role, is_active")
    .or(`id.eq.${user.id},user_id.eq.${user.id}`)
    .maybeSingle();

  if (profileResult.error) {
    profileResult = await supabase
      .from("admin_profiles")
      .select("id, role, is_active")
      .eq("id", user.id)
      .maybeSingle();
  }

  const { data: profile, error } = profileResult as {
    data: { id: string; role: AdminRole; is_active: boolean } | null;
    error: { message?: string } | null;
  };

  if (error || !profile || !profile.is_active) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Acceso prohibido" }, { status: 403 }),
    };
  }

  if (!hasRequiredRole(profile.role, minimumRole)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Acceso prohibido" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    context: {
      supabase,
      userId: user.id,
      role: profile.role,
    },
  };
}

export async function requireEditorApi() {
  return requireApiRole("editor");
}

export async function requireAdminApi() {
  return requireApiRole("admin");
}
