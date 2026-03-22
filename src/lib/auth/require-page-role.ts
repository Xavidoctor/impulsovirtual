import "server-only";

import { redirect } from "next/navigation";

import { hasRequiredRole, type AdminRole, type AdminProfile } from "@/src/lib/auth/roles";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

async function getProfileForUser(userId: string): Promise<AdminProfile | null> {
  const supabase = await createSupabaseServerClient();
  const db = supabase as unknown as { from: (table: string) => any };
  let result = await db
    .from("admin_profiles")
    .select("*")
    .or(`id.eq.${userId},user_id.eq.${userId}`)
    .maybeSingle();

  if (result.error) {
    result = await supabase
      .from("admin_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
  }

  const { data, error } = result as { data: AdminProfile | null; error: { message?: string } | null };

  if (error) {
    return null;
  }

  return data;
}

export async function requirePageRole(minimumRole: AdminRole) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const profile = await getProfileForUser(user.id);
  if (!profile || !profile.is_active || !hasRequiredRole(profile.role, minimumRole)) {
    redirect("/admin/login?error=forbidden");
  }

  return { supabase, user, profile };
}

export async function requireEditorPage() {
  return requirePageRole("editor");
}

export async function requireAdminPage() {
  return requirePageRole("admin");
}
